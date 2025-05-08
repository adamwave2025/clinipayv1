
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "./utils.ts";
import { handlePaymentIntentSucceeded, handlePaymentIntentFailed } from "./handlers.ts";

serve(async (req) => {
  // Log each webhook request received
  console.log(`Payment webhook received at: ${new Date().toISOString()}`);
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Check for required environment variables
  const stripeWebhookSecret = Deno.env.get("STRIPE_INTENT_SECRET");
  const stripeSecretKey = Deno.env.get("SECRET_KEY");

  if (!stripeWebhookSecret) {
    console.error("Missing STRIPE_INTENT_SECRET");
    return new Response(
      JSON.stringify({ error: "Server configuration error: Missing STRIPE_INTENT_SECRET" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!stripeSecretKey) {
    console.error("Missing SECRET_KEY");
    return new Response(
      JSON.stringify({ error: "Server configuration error: Missing SECRET_KEY" }),
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

    // Log signature information for debugging
    console.log(`Received signature: ${signature.substring(0, 10)}...`);

    // Get the request body as text for webhook verification
    const body = await req.text();
    console.log(`Request body length: ${body.length}`);
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verify the webhook signature using the async method
    let event;
    try {
      // Use constructEventAsync instead of constructEvent
      console.log("Attempting to verify webhook signature...");
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
      console.log("Webhook signature verified successfully!");
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received event: ${event.type}`);
    console.log(`Event ID: ${event.id}`);

    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      console.log(`Processing payment_intent.succeeded event: ${event.id}`);
      await handlePaymentIntentSucceeded(event.data.object, supabaseClient);
    } else if (event.type === "payment_intent.payment_failed") {
      console.log(`Processing payment_intent.payment_failed event: ${event.id}`);
      await handlePaymentIntentFailed(event.data.object, supabaseClient);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    console.log("Webhook processing completed successfully");
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    return new Response(
      JSON.stringify({ error: `Webhook error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
