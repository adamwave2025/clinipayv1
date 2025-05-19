
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { NotificationService } from "./notificationService.ts";
import { PlanService } from "./planService.ts";

/**
 * Handle a refund update event from Stripe
 */
export async function handleRefundUpdated(refund: any, stripeClient: Stripe, supabaseClient: any) {
  console.log("Processing refund.updated event:", refund.id);
  console.log("Refund details:", JSON.stringify({
    id: refund.id,
    amount: refund.amount,
    status: refund.status,
    charge: refund.charge
  }));
  
  try {
    // Only process completed refunds
    if (refund.status !== 'succeeded') {
      console.log(`Refund ${refund.id} status is ${refund.status}, not processing further`);
      return;
    }
    
    // Get the charge ID to find the payment
    const chargeId = refund.charge;
    if (!chargeId) {
      console.error("No charge ID found in refund");
      return;
    }
    
    console.log(`Looking up payment for charge: ${chargeId}`);
    
    // Get the payment intent from the charge
    const charge = await stripeClient.charges.retrieve(chargeId);
    if (!charge || !charge.payment_intent) {
      console.error("No payment intent found for charge");
      return;
    }
    
    const paymentIntentId = typeof charge.payment_intent === 'string' 
      ? charge.payment_intent 
      : charge.payment_intent.id;
    
    console.log(`Found payment intent: ${paymentIntentId}`);
    
    // Find the payment record in our database
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("stripe_payment_id", paymentIntentId)
      .maybeSingle();
      
    if (paymentError) {
      console.error("Error finding payment record:", paymentError);
      return;
    }
    
    if (!paymentData) {
      console.error(`No payment record found for payment intent: ${paymentIntentId}`);
      return;
    }
    
    console.log(`Found payment record: ${paymentData.id}`);
    
    // Check if this is a full or partial refund
    const paymentAmount = paymentData.amount_paid;
    const refundAmount = refund.amount;
    const isFullRefund = refundAmount >= paymentAmount;
    
    console.log(`Refund amount: ${refundAmount}, Payment amount: ${paymentAmount}, Full refund: ${isFullRefund}`);
    
    // Try to retrieve refund fee information
    let refundFeeAmount = 0;
    try {
      // First try to get refund with expanded balance transaction
      const refundDetails = await stripeClient.refunds.retrieve(refund.id, {
        expand: ['balance_transaction']
      });
      
      console.log("Retrieved expanded refund details:", refundDetails.id);
      
      if (refundDetails.balance_transaction) {
        // Extract the fee from the balance transaction (use absolute value as fee is negative)
        refundFeeAmount = Math.abs(refundDetails.balance_transaction.fee || 0);
        console.log(`Found refund fee from expanded transaction: ${refundFeeAmount} cents`);
      } else if (refund.balance_transaction) {
        // If we have a balance transaction ID but it's not expanded, retrieve it directly
        const transactionId = typeof refund.balance_transaction === 'string'
          ? refund.balance_transaction
          : refund.balance_transaction.id;
          
        console.log(`Retrieving balance transaction: ${transactionId}`);
        const balanceTransaction = await stripeClient.balanceTransactions.retrieve(transactionId);
        
        refundFeeAmount = Math.abs(balanceTransaction.fee || 0);
        console.log(`Found refund fee from direct transaction: ${refundFeeAmount} cents`);
      }
    } catch (feeError) {
      console.error("Error retrieving refund fee:", feeError);
      console.log("Continuing with refund processing without fee information");
    }
    
    // Update the payment record
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
        stripe_refund_id: refund.id,
        stripe_refund_fee: refundFeeAmount
      })
      .eq("id", paymentData.id);
      
    if (updateError) {
      console.error("Error updating payment record:", updateError);
      return;
    }
    
    console.log(`Updated payment ${paymentData.id} status to ${isFullRefund ? 'refunded' : 'partially_refunded'} with refund fee: ${refundFeeAmount} cents`);
    
    // Check if this payment is associated with a payment request
    const { data: requestData, error: requestError } = await supabaseClient
      .from("payment_requests")
      .select("id")
      .eq("payment_id", paymentData.id)
      .maybeSingle();
      
    if (requestError) {
      console.error("Error checking for payment request:", requestError);
    } else if (requestData) {
      console.log(`Found associated payment request: ${requestData.id}`);
      
      // Update payment plan if needed - handle both full and partial refunds the same way
      await PlanService.updatePlanAfterRefund(
        supabaseClient,
        requestData.id,
        true // Treat all refunds the same way to update metrics
      );
    }
    
    // Queue notifications for the refund
    await NotificationService.queueRefundNotifications(
      supabaseClient,
      paymentData,
      refundAmount
    );
    
    console.log("Refund processing completed successfully");
  } catch (error) {
    console.error("Error processing refund:", error);
    console.error("Stack trace:", error.stack);
  }
}
