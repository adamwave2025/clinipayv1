
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
    } else if (event.type === "refund.updated") {
      console.log(`Processing refund.updated event: ${event.id}`);
      await handleRefundUpdated(event.data.object, stripe, supabaseClient);
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

/**
 * Handle refund.updated events to update the refund fee in the payments table
 * This handler runs after the refund has been fully processed by Stripe
 * and the balance transaction details are available
 */
async function handleRefundUpdated(refund: Stripe.Refund, stripe: Stripe, supabase: any) {
  try {
    console.log(`Processing refund update with ID: ${refund.id}`);
    console.log(`Initial refund data:`, JSON.stringify({
      id: refund.id,
      amount: refund.amount,
      status: refund.status,
      hasBalanceTransaction: !!refund.balance_transaction
    }));
    
    // Get the full refund details with expanded balance_transaction
    // This is necessary because the webhook event might not include the expanded balance_transaction
    const fullRefund = await stripe.refunds.retrieve(refund.id, {
      expand: ['balance_transaction']
    });
    
    console.log(`Retrieved full refund with expanded data:`, JSON.stringify({
      id: fullRefund.id,
      amount: fullRefund.amount,
      status: fullRefund.status,
      hasBalanceTransaction: !!fullRefund.balance_transaction,
      balanceTransactionType: typeof fullRefund.balance_transaction
    }));
    
    // Skip if the balance_transaction is still not available
    if (!fullRefund.balance_transaction) {
      console.log("No balance_transaction found in refund after expansion, skipping fee update");
      return;
    }
    
    // Extract the balance transaction object
    const balanceTransaction = typeof fullRefund.balance_transaction === 'string' 
      ? await stripe.balanceTransactions.retrieve(fullRefund.balance_transaction)
      : fullRefund.balance_transaction;
    
    console.log("Retrieved balance transaction:", JSON.stringify({
      id: balanceTransaction.id,
      amount: balanceTransaction.amount,
      fee: balanceTransaction.fee,
      net: balanceTransaction.net,
      type: balanceTransaction.type
    }));
    
    // Extract the fee amount (in cents/pence)
    // The fee is negative in refunds, so we take the absolute value
    const refundFee = Math.abs(balanceTransaction.fee);
    console.log(`Extracted refund fee: ${refundFee} (cents/pence)`);
    
    // Find the payment record using the refund ID
    console.log(`Looking for payment with stripe_refund_id: ${refund.id}`);
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .select("id, stripe_refund_fee")
      .eq("stripe_refund_id", refund.id)
      .single();
    
    if (paymentError) {
      console.error("Error finding payment record:", paymentError);
      throw new Error(`Payment record with refund ID ${refund.id} not found`);
    }
    
    console.log(`Found payment record with ID: ${paymentData.id}`);
    console.log(`Current refund fee: ${paymentData.stripe_refund_fee}, New refund fee: ${refundFee}`);
    
    // Update the payment record with the refund fee
    const { error: updateError } = await supabase
      .from("payments")
      .update({ stripe_refund_fee: refundFee })
      .eq("id", paymentData.id);
    
    if (updateError) {
      console.error("Error updating payment with refund fee:", updateError);
      throw new Error(`Failed to update payment ${paymentData.id} with refund fee`);
    }
    
    console.log(`Successfully updated payment ${paymentData.id} with refund fee: ${refundFee}`);
    
    return { success: true };
  } catch (error) {
    console.error(`Error processing refund update: ${error.message}`);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

