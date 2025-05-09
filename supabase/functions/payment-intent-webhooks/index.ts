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
 * This handler retrieves the refund fee by following the chain:
 * payment → charge → application fee → fee refund
 * This approach works properly with Stripe Connect accounts where the fee is
 * charged to the platform account, not the connected account
 */
async function handleRefundUpdated(refund: Stripe.Refund, stripe: Stripe, supabase: any) {
  try {
    console.log(`Processing refund update with ID: ${refund.id}`);
    console.log(`Refund details: Amount=${refund.amount}, Status=${refund.status}`);
    
    // Find the payment record using the refund ID
    console.log(`Looking for payment with stripe_refund_id: ${refund.id}`);
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .select("id, stripe_payment_id, stripe_refund_fee")
      .eq("stripe_refund_id", refund.id)
      .single();
    
    if (paymentError) {
      console.error("Error finding payment record:", paymentError);
      throw new Error(`Payment record with refund ID ${refund.id} not found`);
    }
    
    console.log(`Found payment record with ID: ${paymentData.id}`);
    console.log(`Original payment intent ID: ${paymentData.stripe_payment_id}`);
    
    // Step 1: Retrieve the original payment intent to get the charge ID
    console.log("Step 1: Retrieving payment intent...");
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentData.stripe_payment_id);
    
    if (!paymentIntent.latest_charge) {
      console.error("No charge found on payment intent");
      return { success: false, error: "No charge found on payment intent" };
    }
    
    const chargeId = paymentIntent.latest_charge;
    console.log(`Found charge ID: ${chargeId}`);
    
    // Step 2: Retrieve the charge to get the application fee ID
    console.log("Step 2: Retrieving charge...");
    const charge = await stripe.charges.retrieve(
      typeof chargeId === 'string' ? chargeId : chargeId.id
    );
    
    if (!charge.application_fee) {
      console.error("No application fee found on charge");
      // Fallback to traditional refund fee retrieval if no application fee exists
      console.log("Falling back to balance transaction fee retrieval...");
      return await fallbackToBalanceTransaction(refund, stripe, supabase, paymentData.id);
    }
    
    const applicationFeeId = typeof charge.application_fee === 'string'
      ? charge.application_fee
      : charge.application_fee.id;
    console.log(`Found application fee ID: ${applicationFeeId}`);
    
    // Step 3: Get the application fee and its refunds
    console.log("Step 3: Retrieving application fee and refunds...");
    const applicationFee = await stripe.applicationFees.retrieve(applicationFeeId, {
      expand: ['refunds']
    });
    
    // Step 4: Find the fee refund associated with our refund
    console.log("Step 4: Finding matching fee refund...");
    let feeRefund;
    
    if (applicationFee.refunds && applicationFee.refunds.data) {
      // Look for a refund with matching created timestamp (within 10 seconds)
      const refundCreatedTimestamp = refund.created;
      
      console.log(`Looking for fee refund with timestamp near: ${new Date(refundCreatedTimestamp * 1000).toISOString()}`);
      console.log(`Found ${applicationFee.refunds.data.length} fee refunds to check`);
      
      for (const feeRefundCandidate of applicationFee.refunds.data) {
        console.log(`Checking fee refund ID: ${feeRefundCandidate.id}, created: ${new Date(feeRefundCandidate.created * 1000).toISOString()}`);
        
        // Check if timestamps are within 10 seconds of each other
        const timeDiffInSeconds = Math.abs(feeRefundCandidate.created - refundCreatedTimestamp);
        console.log(`Time difference: ${timeDiffInSeconds} seconds`);
        
        if (timeDiffInSeconds < 10) {
          feeRefund = feeRefundCandidate;
          console.log(`Found matching fee refund: ${feeRefund.id}`);
          break;
        }
      }
    }
    
    if (!feeRefund) {
      console.log("No matching fee refund found, trying to retrieve all fee refunds...");
      
      // If no match found by timestamp, try listing all refunds for this application fee
      const allFeeRefunds = await stripe.applicationFeeRefunds.list({
        fee: applicationFeeId,
        limit: 10, // Limit to recent refunds
      });
      
      console.log(`Retrieved ${allFeeRefunds.data.length} fee refunds`);
      
      // Sort by created time (most recent first) and take the first one
      // This assumes the most recent refund is the one we're looking for
      if (allFeeRefunds.data.length > 0) {
        allFeeRefunds.data.sort((a, b) => b.created - a.created);
        feeRefund = allFeeRefunds.data[0];
        console.log(`Using most recent fee refund: ${feeRefund.id}`);
      } else {
        console.log("No fee refunds found, falling back to balance transaction");
        return await fallbackToBalanceTransaction(refund, stripe, supabase, paymentData.id);
      }
    }
    
    // Step 5: Extract the refund fee amount
    if (feeRefund) {
      // The fee refund amount is the amount of fee that was refunded (in cents/pence)
      const refundFee = feeRefund.amount || 0;
      console.log(`Extracted refund fee: ${refundFee} (cents/pence)`);
      
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
      
      return { success: true, refundFee };
    } else {
      console.error("Could not determine refund fee amount");
      return { success: false, error: "Could not determine refund fee" };
    }
  } catch (error) {
    console.error(`Error processing refund update: ${error.message}`);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback method to get refund fee from balance transaction when application fee approach fails
 * This is the original implementation approach and works for non-Connect accounts
 */
async function fallbackToBalanceTransaction(refund: Stripe.Refund, stripe: Stripe, supabase: any, paymentId: string) {
  try {
    console.log("Falling back to balance transaction approach for fee retrieval");
    
    // Get the full refund details with expanded balance_transaction
    const fullRefund = await stripe.refunds.retrieve(refund.id, {
      expand: ['balance_transaction']
    });
    
    console.log(`Retrieved full refund with expanded data:`, JSON.stringify({
      id: fullRefund.id,
      amount: fullRefund.amount,
      hasBalanceTransaction: !!fullRefund.balance_transaction,
      balanceTransactionType: typeof fullRefund.balance_transaction
    }));
    
    // Skip if the balance_transaction is still not available
    if (!fullRefund.balance_transaction) {
      console.log("No balance_transaction found in refund after expansion, skipping fee update");
      return { success: false, error: "No balance transaction available" };
    }
    
    // Extract the balance transaction object
    const balanceTransaction = typeof fullRefund.balance_transaction === 'string' 
      ? await stripe.balanceTransactions.retrieve(fullRefund.balance_transaction)
      : fullRefund.balance_transaction;
    
    console.log("Retrieved balance transaction:", JSON.stringify({
      id: balanceTransaction.id,
      amount: balanceTransaction.amount,
      fee: balanceTransaction.fee,
      net: balanceTransaction.net
    }));
    
    // Extract the fee amount (in cents/pence)
    // The fee is negative in refunds, so we take the absolute value
    const refundFee = Math.abs(balanceTransaction.fee || 0);
    console.log(`Extracted refund fee from balance transaction: ${refundFee} (cents/pence)`);
    
    // Update the payment record with the refund fee
    const { error: updateError } = await supabase
      .from("payments")
      .update({ stripe_refund_fee: refundFee })
      .eq("id", paymentId);
    
    if (updateError) {
      console.error("Error updating payment with refund fee:", updateError);
      throw new Error(`Failed to update payment ${paymentId} with refund fee`);
    }
    
    console.log(`Successfully updated payment ${paymentId} with refund fee: ${refundFee} using balance transaction`);
    
    return { success: true, refundFee };
  } catch (error) {
    console.error(`Error in fallback refund fee retrieval: ${error.message}`);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}
