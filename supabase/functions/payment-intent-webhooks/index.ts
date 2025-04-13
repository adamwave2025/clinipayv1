
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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
    
    // Process the webhook asynchronously as a background task
    // This ensures we return a response quickly to Stripe
    const processWebhook = async () => {
      try {
        const stripe = new Stripe(Deno.env.get("SECRET_KEY") ?? "", {
          apiVersion: "2023-10-16",
        });

        // Verify webhook signature
        let event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
        } catch (err) {
          console.error(`Webhook signature verification failed: ${err.message}`);
          return;
        }

        console.log(`Processing background webhook event: ${event.type}`);

        // Handle the event based on its type
        if (event.type === "payment_intent.succeeded") {
          await handlePaymentIntentSucceeded(event.data.object, supabaseClient);
        } else if (event.type === "payment_intent.payment_failed") {
          await handlePaymentIntentFailed(event.data.object, supabaseClient);
        } else {
          console.log(`Ignoring event type: ${event.type}`);
        }
      } catch (error) {
        console.error(`Background webhook processing error: ${error.message}`);
        console.error("Stack trace:", error.stack);
      }
    };

    // Run webhook processing in the background
    if (typeof EdgeRuntime !== 'undefined') {
      EdgeRuntime.waitUntil(processWebhook());
    } else {
      // Fallback for local development
      processWebhook().catch(console.error);
    }

    // Return a success response immediately
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: `Webhook error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
