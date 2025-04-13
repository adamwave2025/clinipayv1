
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, initStripe, initSupabase, safeLog, checkEnvironment } from "./utils.ts";
import { handlePaymentIntentSucceeded, handlePaymentIntentFailed } from "./handlers.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Start with extensive diagnostics and environment checks
    console.log(`Payment intent webhook received at ${new Date().toISOString()}`);
    console.log(`Request method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    console.log(`Request headers: ${Array.from(req.headers.keys()).join(', ')}`);
    
    // Verify environment configuration
    try {
      checkEnvironment();
      console.log("Environment checks passed");
    } catch (envError) {
      console.error("Environment configuration error:", envError.message);
      return new Response(
        JSON.stringify({ error: "Server configuration error", details: envError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Initialize Supabase client - this will test the connection
    let supabaseClient;
    try {
      supabaseClient = await initSupabase();
    } catch (dbError) {
      console.error("Database connection error:", dbError.message);
      return new Response(
        JSON.stringify({ error: "Database connection error", details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the stripe webhook secret
    const stripeWebhookSecret = Deno.env.get("STRIPE_INTENT_SECRET");
    if (!stripeWebhookSecret) {
      console.error("Missing STRIPE_INTENT_SECRET");
      return new Response(
        JSON.stringify({ error: "Server configuration error", details: "Missing webhook secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract signature from header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe signature", details: "The request is missing the stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body for webhook verification
    const body = await req.text();
    console.log(`Request body received, length: ${body.length} characters`);
    if (body.length < 10) {
      console.error("Request body is suspiciously short:", body);
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload", details: "Request body is too short" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Initialize Stripe client
    const stripe = initStripe();

    // Verify webhook signature ASYNCHRONOUSLY
    let event;
    try {
      console.log("Verifying Stripe signature asynchronously...");
      // Use constructEventAsync instead of constructEvent
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
      console.log("Signature verification successful");
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      console.error("Signature provided:", signature.substring(0, 20) + "...");
      console.error("Webhook secret length:", stripeWebhookSecret.length);
      
      return new Response(
        JSON.stringify({ 
          error: `Webhook signature verification failed`,
          details: err.message,
          signatureLength: signature.length,
          bodyPreview: body.substring(0, 100) + "..." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the event details
    console.log(`Event ID: ${event.id}, Type: ${event.type}, Created: ${new Date(event.created * 1000).toISOString()}`);
    safeLog("Event data", event.data.object);

    // Prepare successful response
    const responsePromise = new Response(
      JSON.stringify({ received: true, event_id: event.id, event_type: event.type }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    // Process the webhook event in the background
    const processPromise = (async () => {
      try {
        console.log(`Processing webhook event: ${event.type} (ID: ${event.id})`);
        
        // Add additional logging for debugging
        if (event.data && event.data.object) {
          console.log(`Event data object ID: ${event.data.object.id}`);
          console.log(`Event data object status: ${event.data.object.status}`);
          
          if (event.data.object.metadata) {
            safeLog(`Event metadata`, event.data.object.metadata);
          }
        }

        // Handle the event based on its type
        if (event.type === "payment_intent.succeeded") {
          try {
            await handlePaymentIntentSucceeded(event.data.object, supabaseClient);
            console.log(`Successfully processed payment_intent.succeeded for ${event.data.object.id}`);
          } catch (handlerError) {
            console.error(`Error in payment_intent.succeeded handler: ${handlerError.message}`);
            console.error(handlerError.stack);
            // We don't rethrow here to prevent retries if there's a persistent issue
          }
        } else if (event.type === "payment_intent.payment_failed") {
          try {
            await handlePaymentIntentFailed(event.data.object, supabaseClient);
            console.log(`Successfully processed payment_intent.payment_failed for ${event.data.object.id}`);
          } catch (handlerError) {
            console.error(`Error in payment_intent.payment_failed handler: ${handlerError.message}`);
            console.error(handlerError.stack);
            // We don't rethrow here to prevent retries if there's a persistent issue
          }
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
    
    // Provide detailed error response
    return new Response(
      JSON.stringify({ 
        error: `Webhook processing error`,
        message: error.message,
        stack: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available',
        time: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
