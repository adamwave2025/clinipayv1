
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "./utils.ts";
import { handlePaymentIntentSucceeded, handlePaymentIntentFailed } from "./paymentHandlers.ts";
import { handleRefundUpdated } from "./refundHandlers.ts";

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
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get request body for webhook event verification
    const body = await req.text();
    console.log("Webhook body length:", body.length);
    console.log("Webhook body preview:", body.substring(0, 200) + "...");
    
    // Get Stripe signature from headers
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      console.error("No Stripe signature found in request headers");
      return new Response(
        JSON.stringify({ error: "No Stripe signature found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Stripe signature received:", signature.substring(0, 20) + "...");
    console.log("Using webhook secret:", stripeWebhookSecret.substring(0, 5) + "...");
    
    // Verify the webhook signature USING ASYNC METHOD
    let event;
    
    try {
      // Replace synchronous constructEvent with async constructEventAsync
      event = await stripe.webhooks.constructEventAsync(
        body, 
        signature, 
        stripeWebhookSecret
      );
      console.log(`Webhook event verified: ${event.type}`);
      console.log(`Event ID: ${event.id}`);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      console.error("Error details:", err);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process different webhook event types
    let result;
    
    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Processing payment_intent.succeeded event");
        result = await handlePaymentIntentSucceeded(event.data.object, supabaseClient);
        break;
        
      case "payment_intent.payment_failed":
        console.log("Processing payment_intent.payment_failed event");
        result = await handlePaymentIntentFailed(event.data.object, supabaseClient);
        break;
        
      case "charge.refunded":
        console.log("Processing charge.refunded event");
        result = await handleRefundUpdated(event.data.object, stripe, supabaseClient);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
        result = { status: "ignored", message: `Event type ${event.type} not handled` };
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

