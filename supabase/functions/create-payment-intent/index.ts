
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Generate a unique, readable payment reference
function generatePaymentReference(prefix = "CLN", length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoids confusing chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Log request info for debugging
    console.log(`Processing payment request: ${req.method} ${req.url}`);
    
    // Get Stripe secret key from environment variables
    const stripeSecretKey = Deno.env.get("SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("Missing Stripe secret key");
      throw new Error("Payment processing is not configured properly. Please contact support.");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16"
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      throw new Error("Database connection not configured. Please contact support.");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Check if this is a payment request and fetch the associated payment link if needed
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

    // Calculate platform fee amount
    const platformFeeAmount = Math.floor(amount * (platformFeePercent / 100));
    
    console.log(`Platform fee: ${platformFeePercent}%, Platform fee amount: ${platformFeeAmount}`);

    // Generate a unique payment reference
    const paymentReference = generatePaymentReference();
    console.log(`Generated payment reference: ${paymentReference}`);

    // Create a payment attempt record to track this payment
    const { data: paymentAttempt, error: paymentAttemptError } = await supabase
      .from("payment_attempts")
      .insert({
        clinic_id: clinicId,
        payment_link_id: associatedPaymentLinkId || null,
        payment_request_id: requestId || null,
        amount: amount,
        status: "created"
      })
      .select()
      .single();

    if (paymentAttemptError) {
      console.warn("Failed to create payment attempt record:", paymentAttemptError);
      // Continue processing even if the attempt record fails
    } else {
      console.log("Created payment attempt record:", paymentAttempt.id);
    }
    
    // Create a payment intent using Stripe Connect Direct Charges
    // This ensures that Stripe's processing fees come out of our platform fee, not the clinic's portion
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "gbp",
      payment_method_types: ["card"],
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: clinicData.stripe_account_id,
      },
      metadata: {
        clinicId: clinicId,
        paymentLinkId: associatedPaymentLinkId || '',
        requestId: requestId || '',
        platformFeePercent: platformFeePercent.toString(),
        paymentReference: paymentReference,
        patientName: patientInfo.name || paymentMethod.billing_details?.name || '',
        patientEmail: patientInfo.email || paymentMethod.billing_details?.email || '',
        patientPhone: patientInfo.phone || paymentMethod.billing_details?.phone || '',
        customAmount: customAmount ? customAmount.toString() : ''
      },
    });

    console.log("Payment intent created:", paymentIntent.id);

    // Update the payment attempt with the payment intent ID if we successfully created one
    if (paymentAttempt) {
      const { error: updateAttemptError } = await supabase
        .from("payment_attempts")
        .update({
          payment_intent_id: paymentIntent.id,
          status: "pending"
        })
        .eq("id", paymentAttempt.id);

      if (updateAttemptError) {
        console.warn("Failed to update payment attempt with intent ID:", updateAttemptError);
      } else {
        console.log("Updated payment attempt with payment intent ID:", paymentIntent.id);
      }
    }

    // Return the client secret to the frontend along with the payment link id if it exists
    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentIntent.id,
        paymentReference: paymentReference,
        paymentLinkId: associatedPaymentLinkId || null,
        attemptId: paymentAttempt?.id || null
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (err) {
    console.error("Payment processing error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "An unexpected error occurred",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
