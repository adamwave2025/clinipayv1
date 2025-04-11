
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
  const { associatedPaymentLinkId, patientInfo, customAmount } = 
    await getPaymentRequestData(supabase, requestId, paymentLinkId);

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
    customAmount: customAmount ? customAmount.toString() : ''
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
  
  if (requestId) {
    console.log(`Processing payment for request ID: ${requestId}`);
    
    // Fetch the payment request to get its payment_link_id (if any) and patient info
    const { data: requestData, error: requestError } = await supabase
      .from("payment_requests")
      .select("payment_link_id, patient_name, patient_email, patient_phone, custom_amount")
      .eq("id", requestId)
      .single();
      
    if (requestError) {
      console.error("Error fetching payment request data:", requestError);
    } else if (requestData) {
      console.log(`Found payment request data:`, requestData);
      
      if (requestData.payment_link_id) {
        console.log(`Found associated payment link ID: ${requestData.payment_link_id} for request ID: ${requestId}`);
        // If the request is associated with a payment link, use that ID
        associatedPaymentLinkId = requestData.payment_link_id;
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
  }

  return { associatedPaymentLinkId, patientInfo, customAmount };
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
