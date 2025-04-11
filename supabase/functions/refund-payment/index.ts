
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
    // Get Stripe secret key from environment variables - UPDATED KEY NAME
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
      throw new Error("Invalid refund request format.");
    }

    const { paymentId, refundAmount, fullRefund } = requestBody;

    if (!paymentId) {
      throw new Error("Missing payment ID.");
    }

    console.log(`Processing refund for payment ${paymentId}, amount: ${refundAmount}, fullRefund: ${fullRefund}`);

    // Get the payment record from database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      console.error("Error fetching payment:", paymentError);
      throw new Error("Payment not found.");
    }

    // Check if payment has Stripe payment ID
    if (!payment.stripe_payment_id) {
      throw new Error("This payment does not have a Stripe payment ID.");
    }

    // Get the clinic's Stripe account ID
    const { data: clinicData, error: clinicError } = await supabase
      .from("clinics")
      .select("stripe_account_id")
      .eq("id", payment.clinic_id)
      .single();

    if (clinicError || !clinicData?.stripe_account_id) {
      console.error("Error fetching clinic data:", clinicError);
      throw new Error("Clinic Stripe account not found.");
    }

    const stripeAccountId = clinicData.stripe_account_id;

    // Process refund via Stripe
    let stripeRefund;
    try {
      // Create refund
      stripeRefund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_id,
        amount: fullRefund ? undefined : Math.round(refundAmount * 100), // Convert to cents for Stripe if partial refund
      }, {
        stripeAccount: stripeAccountId, // Use the clinic's connected account
      });
      
      console.log("Stripe refund created:", stripeRefund.id);
    } catch (stripeError) {
      console.error("Stripe refund error:", stripeError);
      throw new Error(`Stripe refund failed: ${stripeError.message}`);
    }

    // Update payment record in database
    const newStatus = fullRefund ? 'refunded' : 'partially_refunded';
    const refundAmountToStore = fullRefund ? payment.amount_paid : refundAmount;
    
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        refund_amount: refundAmountToStore,
        refunded_at: new Date().toISOString(),
        stripe_refund_id: stripeRefund.id
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error("Error updating payment record:", updateError);
      throw new Error("Refund was processed but database update failed.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundId: stripeRefund.id,
        status: newStatus
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
    console.error("Refund processing error:", err);
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
