
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
      
      case "refund.updated":
        console.log("Processing refund.updated event");
        result = await handleRefundUpdated(event.data.object, stripe, supabaseClient);
        break;
      
      case "account.updated":
        console.log("Processing account.updated event");
        // Handle Stripe account update
        const account = event.data.object;
        result = await handleAccountUpdated(account, supabaseClient);
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

/**
 * Handle Stripe Account updates to ensure status is properly set
 */
async function handleAccountUpdated(account: any, supabaseClient: any) {
  try {
    console.log(`Processing Stripe account update for account: ${account.id}`);
    
    // Check if the account details and ID are valid
    if (!account || !account.id) {
      console.error("Invalid account data received");
      return { success: false, error: "Invalid account data" };
    }
    
    // Log key account details for debugging
    console.log(`Account ID: ${account.id}`);
    console.log(`Account Details Available: ${JSON.stringify({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted
    })}`);
    
    // Determine the account status
    let stripeStatus = 'pending';
    
    // If charges are enabled, the account setup is complete
    if (account.charges_enabled === true) {
      stripeStatus = 'connected';
      console.log(`Account ${account.id} is fully onboarded with charges enabled`);
    } else if (account.details_submitted === true) {
      // If details are submitted but charges not enabled yet, still pending review
      console.log(`Account ${account.id} has submitted details but charges not enabled yet`);
    } else {
      console.log(`Account ${account.id} is still in onboarding process`);
    }
    
    // Find clinic with this Stripe account ID
    const { data: clinicData, error: clinicError } = await supabaseClient
      .from("clinics")
      .select("id, stripe_status")
      .eq("stripe_account_id", account.id)
      .maybeSingle();
    
    if (clinicError) {
      console.error("Error finding clinic:", clinicError);
      return { success: false, error: clinicError.message };
    }
    
    if (!clinicData) {
      console.log(`No clinic found with Stripe account ID: ${account.id}`);
      return { success: false, error: "No matching clinic found" };
    }
    
    console.log(`Found clinic ID: ${clinicData.id} with current status: ${clinicData.stripe_status}`);
    
    // Only update if the status is different
    if (clinicData.stripe_status !== stripeStatus) {
      // Update the clinic's Stripe status
      const { error: updateError } = await supabaseClient
        .from("clinics")
        .update({ 
          stripe_status: stripeStatus,
        })
        .eq("id", clinicData.id);
      
      if (updateError) {
        console.error("Error updating clinic stripe status:", updateError);
        return { success: false, error: updateError.message };
      }
      
      console.log(`Updated clinic ${clinicData.id} Stripe status to: ${stripeStatus}`);
      
      return { 
        success: true, 
        message: `Stripe account status updated to ${stripeStatus}`,
        clinicId: clinicData.id,
        stripeAccountId: account.id
      };
    } else {
      console.log(`No status change needed for clinic ${clinicData.id}, already ${stripeStatus}`);
      return { 
        success: true, 
        message: "No status change needed",
        clinicId: clinicData.id,
        stripeAccountId: account.id
      };
    }
  } catch (error: any) {
    console.error("Error in handleAccountUpdated:", error);
    console.error("Error stack:", error.stack);
    return { success: false, error: error.message };
  }
}
