
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils.ts";
import { handlePaymentIntentSucceeded, handlePaymentIntentFailed } from "./handlers.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log the request for debugging
    console.log(`Payment webhook received at ${new Date().toISOString()}`);
    console.log(`Request method: ${req.method}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the stripe webhook secret
    const stripeWebhookSecret = Deno.env.get("STRIPE_INTENT_SECRET");
    if (!stripeWebhookSecret) {
      console.error("Missing STRIPE_INTENT_SECRET");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract signature from header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body for webhook verification
    const body = await req.text();
    console.log(`Request body received, length: ${body.length} characters`);
    
    // First try to validate the signature right away to return a quick response
    const stripeSecretKey = Deno.env.get("SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Missing Stripe secret key");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verify webhook signature
    let event;
    try {
      console.log("Verifying Stripe signature...");
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      console.log("Signature verification successful");
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return a success response immediately but continue processing in the background
    // Use a more reliable approach for background processing
    const responsePromise = new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    // Process the webhook event
    const processPromise = (async () => {
      try {
        console.log(`Processing webhook event: ${event.type}`);
        console.log(`Event ID: ${event.id}`);

        // Handle the event based on its type
        if (event.type === "payment_intent.succeeded") {
          await handlePaymentIntentSucceeded(event.data.object, supabaseClient);
        } else if (event.type === "payment_intent.payment_failed") {
          await handlePaymentIntentFailed(event.data.object, supabaseClient);
        } else {
          console.log(`Ignoring event type: ${event.type}`);
        }
        
        console.log(`Webhook processing completed for event: ${event.id}`);
      } catch (error) {
        console.error(`Background webhook processing error: ${error.message}`);
        console.error("Stack trace:", error.stack);
      }
    })();

    // Use EdgeRuntime.waitUntil if available, otherwise process synchronously
    if (typeof EdgeRuntime !== 'undefined') {
      console.log("Using EdgeRuntime.waitUntil for background processing");
      EdgeRuntime.waitUntil(processPromise);
      return responsePromise;
    } else {
      console.log("EdgeRuntime not available, processing synchronously");
      await processPromise;
      return responsePromise;
    }
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    return new Response(
      JSON.stringify({ error: `Webhook error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
