
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { NotificationService } from "./notificationService.ts";
import { PlanService } from "./planService.ts";
import { PatientService } from "./patientService.ts";

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
    
    // Retrieve refund fee using the new advanced method
    let refundFee = 0;
    try {
      console.log("Attempting to retrieve refund fee using primary method...");
      const { success, refundFee: retrievedFee, error } = await retrieveRefundFee(refund, stripeClient, paymentIntentId);
      
      if (success) {
        console.log(`Primary method successful, retrieved refund fee: ${retrievedFee}`);
        refundFee = retrievedFee;
      } else {
        console.log(`Primary method failed: ${error}, falling back to balance transaction method`);
        const fallbackResult = await fallbackToBalanceTransaction(refund, stripeClient, supabaseClient, paymentData.id);
        
        if (fallbackResult.success) {
          console.log(`Fallback method successful, retrieved refund fee: ${fallbackResult.refundFee}`);
          refundFee = fallbackResult.refundFee;
        } else {
          console.log(`Fallback method also failed: ${fallbackResult.error}`);
        }
      }
    } catch (feeError) {
      console.error("Error retrieving refund fee:", feeError);
      console.error("Continuing without refund fee information");
      // Non-critical error, continue processing
    }
    
    // Update the payment record
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
        stripe_refund_id: refund.id,
        stripe_refund_fee: refundFee // Add the refund fee
      })
      .eq("id", paymentData.id);
      
    if (updateError) {
      console.error("Error updating payment record:", updateError);
      return;
    }
    
    console.log(`Updated payment ${paymentData.id} status to ${isFullRefund ? 'refunded' : 'partially_refunded'} with refund fee: ${refundFee}`);
    
    // Try to ensure we have a patient_id for consistent recording
    let patientId = paymentData.patient_id;
    
    // If patient ID is missing, try to find/create it
    if (!patientId && (paymentData.patient_email || paymentData.patient_phone)) {
      try {
        patientId = await PatientService.findOrCreatePatient(
          supabaseClient,
          paymentData.patient_name || 'Unknown Patient',
          paymentData.patient_email,
          paymentData.patient_phone,
          paymentData.clinic_id
        );
        
        if (patientId) {
          console.log(`Resolved patient ID: ${patientId} for refund record`);
          
          // Update payment record with patient_id if it wasn't set
          await supabaseClient
            .from('payments')
            .update({ patient_id: patientId })
            .eq('id', paymentData.id);
        }
      } catch (patientErr) {
        console.error("Error resolving patient ID for refund:", patientErr);
        // Non-critical, continue processing
      }
    }
    
    // Record refund activity in payment_activity
    try {
      await supabaseClient
        .from('payment_activity')
        .insert({
          payment_link_id: paymentData.payment_link_id,
          patient_id: patientId,
          clinic_id: paymentData.clinic_id,
          action_type: isFullRefund ? 'payment_refunded' : 'payment_partially_refunded',
          details: {
            amount: paymentAmount,
            refundAmount: refundAmount,
            paymentId: paymentData.id,
            refundId: refund.id,
            paymentReference: paymentData.payment_ref,
            isFullRefund
          }
        });
        
      console.log(`Recorded refund activity in payment_activity table`);
    } catch (activityError) {
      console.error("Error recording refund activity:", activityError);
      // Non-critical error, continue
    }
    
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
      
      // Update payment request status
      await supabaseClient
        .from("payment_requests")
        .update({
          status: isFullRefund ? 'refunded' : 'partially_refunded'
        })
        .eq("id", requestData.id);
        
      console.log(`Updated payment request ${requestData.id} status to ${isFullRefund ? 'refunded' : 'partially_refunded'}`);
      
      // Update payment schedule status if needed
      await PlanService.updatePlanAfterRefund(
        supabaseClient,
        requestData.id,
        isFullRefund
      );
    }
    
    // Queue notifications for the refund with the monetary_values_in_pence flag
    await NotificationService.queueRefundNotifications(
      supabaseClient,
      paymentData,
      refundAmount,
      true  // Pass true to indicate values are in pence/cents
    );
    
    console.log("Refund processing completed successfully");
  } catch (error) {
    console.error("Error processing refund:", error);
    console.error("Stack trace:", error.stack);
  }
}

/**
 * Primary method to retrieve refund fee from Stripe
 * This method follows the chain: payment → charge → application fee → fee refund
 */
async function retrieveRefundFee(refund: any, stripe: Stripe, paymentIntentId: string) {
  try {
    console.log("Step 1: Retrieving payment intent...");
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
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
      return { success: false, error: "No application fee found on charge" };
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
        console.log("No fee refunds found");
        return { success: false, error: "No fee refunds found" };
      }
    }
    
    // Step 5: Extract the refund fee amount
    if (feeRefund) {
      // The fee refund amount is the amount of fee that was refunded (in cents/pence)
      const refundFee = feeRefund.amount || 0;
      console.log(`Extracted refund fee: ${refundFee} (cents/pence)`);
      
      return { success: true, refundFee };
    } else {
      console.error("Could not determine refund fee amount");
      return { success: false, error: "Could not determine refund fee" };
    }
  } catch (error) {
    console.error(`Error in primary refund fee retrieval: ${error.message}`);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback method to get refund fee from balance transaction when application fee approach fails
 */
async function fallbackToBalanceTransaction(refund: any, stripe: Stripe, supabase: any, paymentId: string) {
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
    
    return { success: true, refundFee };
  } catch (error) {
    console.error(`Error in fallback refund fee retrieval: ${error.message}`);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}
