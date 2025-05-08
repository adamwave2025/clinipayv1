
import { initStripe, initSupabase, generatePaymentReference } from "./utils.ts";
import { corsHeaders } from "./utils.ts";

export async function handleRequest(req: Request) {
  // Log request info for debugging
  console.log(`Processing payment request: ${req.method} ${req.url}`);
  
  // Initialize Stripe and Supabase clients
  const stripe = initStripe();
  const supabase = initSupabase();

  // Parse request body
  let requestBody;
  try {
    requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody));
  } catch (err) {
    console.error("Error parsing request body:", err);
    throw new Error("Invalid payment request format.");
  }

  const { amount, clinicId, paymentLinkId, requestId, paymentMethod } = requestBody;

  if (!amount || !clinicId || !paymentMethod) {
    throw new Error("Missing required payment information.");
  }

  console.log(`Creating payment for clinic ${clinicId}, amount: ${amount}`);
  if (requestId) {
    console.log(`This payment is for request ID: ${requestId}`);
  }

  // Get the clinic's Stripe account ID
  const { data: clinicData, error: clinicError } = await supabase
    .from("clinics")
    .select("stripe_account_id, stripe_status")
    .eq("id", clinicId)
    .single();

  if (clinicError || !clinicData) {
    console.error("Error fetching clinic data:", clinicError);
    throw new Error(`Clinic not found. Please contact the clinic directly for payment options.`);
  }

  if (!clinicData.stripe_account_id || clinicData.stripe_status !== "connected") {
    throw new Error("This clinic does not have payment processing set up.");
  }

  // Check if this is a payment request and fetch associated data
  // Include status in the data we fetch to validate if payment should be allowed
  const { associatedPaymentLinkId, patientInfo, customAmount, requestStatus, planId, planStatus } = 
    await getPaymentRequestData(supabase, requestId, paymentLinkId);
  
  console.log(`Payment request status: ${requestStatus}, Plan ID: ${planId}, Plan status: ${planStatus}`);
  
  // Validate payment status - prevent processing for already paid or cancelled payments
  if (requestStatus) {
    if (requestStatus === 'paid') {
      throw new Error("This payment has already been processed. Please contact the clinic if you believe this is an error.");
    }
    
    if (requestStatus === 'cancelled') {
      throw new Error("This payment link has been cancelled. Please contact the clinic for more information.");
    }
    
    // Only proceed if the payment status is pending, sent, or overdue
    if (!['pending', 'sent', 'overdue'].includes(requestStatus)) {
      throw new Error(`This payment cannot be processed due to its status: ${requestStatus}. Please contact the clinic.`);
    }
  }
  
  // Also validate the plan status if this payment is part of a plan
  if (planId && planStatus) {
    if (planStatus === 'cancelled') {
      throw new Error("This payment plan has been cancelled. Please contact the clinic for more information.");
    }
    
    if (planStatus === 'paused') {
      throw new Error("This payment plan is currently paused. Please contact the clinic for more information.");
    }
    
    // Only allow payments for active, pending, or overdue plans
    if (!['active', 'pending', 'overdue'].includes(planStatus)) {
      throw new Error(`This payment cannot be processed due to the plan status: ${planStatus}. Please contact the clinic.`);
    }
  }

  // Get the platform fee percentage
  const platformFeePercent = await getPlatformFeePercentage(supabase);
  const platformFeeAmount = Math.floor(amount * (platformFeePercent / 100));
  
  console.log(`Platform fee: ${platformFeePercent}%, Platform fee amount: ${platformFeeAmount}`);

  // Generate a unique payment reference
  const paymentReference = generatePaymentReference();
  console.log(`Generated payment reference: ${paymentReference}`);

  // Ensure the requestId is properly included in metadata
  const metadata = {
    clinicId,
    paymentLinkId: associatedPaymentLinkId || '',
    requestId: requestId || '',
    platformFeePercent: platformFeePercent.toString(),
    paymentReference,
    patientName: patientInfo.name || paymentMethod.billing_details?.name || '',
    patientEmail: patientInfo.email || paymentMethod.billing_details?.email || '',
    patientPhone: patientInfo.phone || paymentMethod.billing_details?.phone || '',
    customAmount: customAmount ? customAmount.toString() : '',
    planId: planId || '',
    planStatus: planStatus || '',
  };

  console.log("Payment intent metadata:", metadata);

  try {
    // Create a payment intent using Stripe Connect Direct Charges
    const paymentIntent = await createStripePaymentIntent(
      stripe,
      amount,
      clinicData.stripe_account_id,
      platformFeeAmount,
      metadata
    );

    // Return the client secret to the frontend
    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentIntent.id,
        paymentReference: paymentReference,
        paymentLinkId: associatedPaymentLinkId || null
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error(`Payment processing failed: ${error.message}`);
  }
}

// Helper functions

async function getPaymentRequestData(supabase, requestId, paymentLinkId) {
  let associatedPaymentLinkId = paymentLinkId; // Default to directly provided paymentLinkId
  let patientInfo = { name: "", email: "", phone: "" };
  let customAmount = null;
  let requestStatus = null;
  let planId = null;
  let planStatus = null;
  
  if (requestId) {
    console.log(`Processing payment for request ID: ${requestId}`);
    
    // Fetch the payment request to get its payment_link_id (if any), patient info, and status
    const { data: requestData, error: requestError } = await supabase
      .from("payment_requests")
      .select(`
        payment_link_id, 
        patient_name, 
        patient_email, 
        patient_phone, 
        custom_amount,
        status,
        payment_id
      `)
      .eq("id", requestId)
      .single();
      
    if (requestError) {
      console.error("Error fetching payment request data:", requestError);
    } else if (requestData) {
      console.log(`Found payment request data:`, requestData);
      
      // Store the request status for validation
      requestStatus = requestData.status;
      
      // If the request already has a payment ID, it's already paid
      if (requestData.payment_id) {
        requestStatus = 'paid';
      }
      
      if (requestData.payment_link_id) {
        console.log(`Found associated payment link ID: ${requestData.payment_link_id} for request ID: ${requestId}`);
        // If the request is associated with a payment link, use that ID
        associatedPaymentLinkId = requestData.payment_link_id;
        
        // Check if this payment is part of a payment plan
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("payment_schedule")
          .select("plan_id")
          .eq("payment_request_id", requestId)
          .maybeSingle();
          
        if (!scheduleError && scheduleData && scheduleData.plan_id) {
          planId = scheduleData.plan_id;
          
          // If this is part of a plan, check the plan status
          const { data: planData, error: planError } = await supabase
            .from("plans")
            .select("status")
            .eq("id", planId)
            .single();
            
          if (!planError && planData) {
            planStatus = planData.status;
            console.log(`This payment is part of plan ${planId} with status: ${planStatus}`);
          }
        }
      }
      
      // Store patient info from the request
      patientInfo = {
        name: requestData.patient_name || "",
        email: requestData.patient_email || "",
        phone: requestData.patient_phone || ""
      };
      
      // Store custom amount if available
      customAmount = requestData.custom_amount;
    }
  } else if (paymentLinkId) {
    // If it's a direct payment link (not a request), check the payment link status
    const { data: linkData, error: linkError } = await supabase
      .from("payment_links")
      .select("status")
      .eq("id", paymentLinkId)
      .single();
      
    if (!linkError && linkData) {
      requestStatus = linkData.status;
    }
  }

  return { associatedPaymentLinkId, patientInfo, customAmount, requestStatus, planId, planStatus };
}

async function getPlatformFeePercentage(supabase) {
  // Get the platform fee percentage from platform_settings
  const { data: platformFeeData, error: platformFeeError } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "platform_fee_percent")
    .single();

  // Default platform fee percentage if not found
  let platformFeePercent = 3.0;
  
  if (!platformFeeError && platformFeeData) {
    platformFeePercent = parseFloat(platformFeeData.value);
    console.log(`Found platform fee in database: ${platformFeePercent}%`);
  } else {
    console.log(`Using default platform fee: ${platformFeePercent}%`);
  }

  return platformFeePercent;
}

async function createStripePaymentIntent(stripe, amount, stripeAccountId, platformFeeAmount, metadata) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "gbp",
    payment_method_types: ["card"],
    application_fee_amount: platformFeeAmount,
    transfer_data: {
      destination: stripeAccountId,
    },
    metadata,
  });

  console.log("Payment intent created:", paymentIntent.id);
  return paymentIntent;
}
