
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

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
        paymentLinkId: paymentLinkId || '',
        requestId: requestId || '',
        platformFeePercent: platformFeePercent.toString()
      },
    });

    console.log("Payment intent created:", paymentIntent.id);

    // Track the payment attempt in the database
    const { error: attemptError } = await supabase
      .from('payment_attempts')
      .insert({
        clinic_id: clinicId,
        payment_link_id: paymentLinkId || null,
        payment_request_id: requestId || null,
        amount: amount,
        status: 'created',
        payment_intent_id: paymentIntent.id
      });
      
    if (attemptError) {
      console.error("Error recording payment attempt:", attemptError);
      // Continue processing even if tracking fails - this is not critical
    }

    // Return the client secret to the frontend
    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentIntent.id
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
