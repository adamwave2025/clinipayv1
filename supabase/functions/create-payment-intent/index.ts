
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
    // Get Stripe secret key from environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("Missing Stripe secret key");
      throw new Error("Missing Stripe secret key");
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
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { amount, clinicId, paymentLinkId, requestId } = await req.json();

    if (!amount || !clinicId) {
      throw new Error("Missing required parameters: amount and clinicId");
    }

    console.log(`Creating payment intent for clinic ${clinicId}, amount: ${amount}`);

    // Get the clinic's Stripe account ID
    const { data: clinicData, error: clinicError } = await supabase
      .from("clinics")
      .select("stripe_account_id, stripe_status")
      .eq("id", clinicId)
      .single();

    if (clinicError || !clinicData) {
      console.error("Error fetching clinic data:", clinicError);
      throw new Error(`Clinic not found: ${clinicError?.message}`);
    }

    if (!clinicData.stripe_account_id || clinicData.stripe_status !== "connected") {
      throw new Error("Clinic does not have Stripe connected");
    }

    // Get the platform fee percentage from platform_settings
    const { data: platformFeeData, error: platformFeeError } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "platform_fee_percent")
      .single();

    if (platformFeeError || !platformFeeData) {
      console.error("Error fetching platform fee:", platformFeeError);
      throw new Error(`Platform fee not found: ${platformFeeError?.message}`);
    }

    // Calculate application fee amount (platform fee)
    const platformFeePercent = parseFloat(platformFeeData.value);
    const applicationFeeAmount = Math.floor(amount * (platformFeePercent / 100));

    console.log(`Platform fee: ${platformFeePercent}%, Application fee amount: ${applicationFeeAmount}`);

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "gbp",
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: clinicData.stripe_account_id,
      },
      metadata: {
        clinicId: clinicId,
        paymentLinkId: paymentLinkId || "",
        requestId: requestId || "",
      },
    });

    // Log payment attempt to the database
    await supabase
      .from("payment_attempts")
      .insert({
        clinic_id: clinicId,
        payment_link_id: paymentLinkId || null,
        payment_request_id: requestId || null,
        amount: amount,
        status: "created",
        payment_intent_id: paymentIntent.id,
      });

    // Return the client secret to the client
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
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
    console.error("Error:", err);
    return new Response(
      JSON.stringify({
        error: err.message,
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
