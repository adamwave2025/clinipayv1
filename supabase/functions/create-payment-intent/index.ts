
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

    // Calculate application fee amount (platform fee)
    const applicationFeeAmount = Math.floor(amount * (platformFeePercent / 100));

    console.log(`Platform fee: ${platformFeePercent}%, Application fee amount: ${applicationFeeAmount}`);

    // In a real application, we would process with Stripe here
    // But for a mock UI implementation, we'll just simulate success
    
    // Log the mock payment attempt in the database
    try {
      await supabase
        .from("payment_attempts")
        .insert({
          clinic_id: clinicId,
          payment_link_id: paymentLinkId || null,
          payment_request_id: requestId || null,
          amount: amount,
          status: "created",
          payment_intent_id: `mock_pi_${Date.now()}`,
        });
      console.log("Payment attempt logged successfully");
    } catch (logError) {
      console.warn("Could not log payment attempt:", logError.message);
    }

    // Generate a mock payment ID
    const mockPaymentId = `mock_payment_${Date.now()}`;
    console.log("Mock payment created successfully:", mockPaymentId);

    // Return success to the client
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: mockPaymentId
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
