
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Get the stripe webhook secret for payment intents
  const stripeWebhookSecret = Deno.env.get("STRIPE_INTENT_SECRET");
  if (!stripeWebhookSecret) {
    console.error("Missing STRIPE_INTENT_SECRET");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body as text for webhook verification
    const body = await req.text();
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Verify the webhook signature using the async method
    let event;
    try {
      // Use constructEventAsync instead of constructEvent
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received event: ${event.type}`);

    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      await handlePaymentIntentSucceeded(event.data.object, supabaseClient);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(
      JSON.stringify({ error: `Webhook error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Function to handle payment_intent.succeeded events
async function handlePaymentIntentSucceeded(paymentIntent, supabaseClient) {
  console.log("Processing payment_intent.succeeded:", paymentIntent.id);
  
  try {
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    const {
      clinicId,
      paymentLinkId,
      requestId,
      paymentReference,
      patientName,
      patientEmail,
      patientPhone,
    } = metadata;

    if (!clinicId) {
      console.error("Missing clinicId in payment intent metadata");
      return;
    }

    console.log(`Payment for clinic: ${clinicId}, amount: ${paymentIntent.amount}`);
    
    // Record the payment in the payments table
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        clinic_id: clinicId,
        amount_paid: paymentIntent.amount,
        paid_at: new Date().toISOString(),
        patient_name: patientName || "Unknown",
        patient_email: patientEmail || null,
        patient_phone: patientPhone || null,
        payment_link_id: paymentLinkId || null,
        payment_ref: paymentReference || paymentIntent.id,
        status: "paid",
        stripe_payment_id: paymentIntent.id,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error inserting payment record:", paymentError);
      throw new Error(`Error recording payment: ${paymentError.message}`);
    }

    console.log(`Payment record created with ID: ${paymentData.id}`);

    // If this payment was for a payment request, update the request status
    if (requestId) {
      console.log(`Updating payment request: ${requestId}`);
      
      const { error: requestUpdateError } = await supabaseClient
        .from("payment_requests")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_id: paymentData.id
        })
        .eq("id", requestId);

      if (requestUpdateError) {
        console.error("Error updating payment request:", requestUpdateError);
        // Don't throw error here, we already recorded the payment
      } else {
        console.log(`Payment request ${requestId} marked as paid`);
      }
    }

    console.log("Payment processing completed successfully");
  } catch (error) {
    console.error("Error processing payment intent:", error);
    throw error;
  }
}
