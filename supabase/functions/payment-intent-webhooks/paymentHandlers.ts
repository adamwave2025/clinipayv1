
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
    
    // Update the payment record
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
        stripe_refund_id: refund.id
      })
      .eq("id", paymentData.id);
      
    if (updateError) {
      console.error("Error updating payment record:", updateError);
      return;
    }
    
    console.log(`Updated payment ${paymentData.id} status to ${isFullRefund ? 'refunded' : 'partially_refunded'}`);
    
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
 * Handle refund update events specifically of type refund.updated
 * This handler logs detailed information about the refund for debugging
 * and updates payment records with fee information
 */
export async function handleRefundUpdateEvent(refund: any, stripeClient: Stripe, supabaseClient: any) {
  console.log("Processing refund.updated event:", refund.id);
  console.log("Refund complete details:", JSON.stringify({
    id: refund.id,
    amount: refund.amount,
    status: refund.status,
    created: refund.created,
    currency: refund.currency,
    metadata: refund.metadata || {},
    reason: refund.reason,
    receipt_number: refund.receipt_number
  }));
  
  try {
    // Get the charge ID associated with this refund
    const chargeId = refund.charge;
    if (!chargeId) {
      console.error("No charge ID found in refund");
      return { status: "error", message: "No charge ID found in refund" };
    }
    
    console.log(`Looking up charge data for: ${chargeId}`);
    
    // Variables to store the fee and balance transaction details
    let stripeFee = 0;
    let netAmount = 0;
    let balanceTransactionId = null;
    
    // Get detailed charge information
    try {
      const charge = await stripeClient.charges.retrieve(chargeId);
      console.log("Charge details:", JSON.stringify({
        id: charge.id,
        amount: charge.amount,
        status: charge.status,
        payment_intent: charge.payment_intent,
        refunded: charge.refunded,
        amount_refunded: charge.amount_refunded,
        created: charge.created,
        currency: charge.currency
      }));
      
      // Get payment intent information if available
      const paymentIntentId = typeof charge.payment_intent === 'string' 
        ? charge.payment_intent 
        : charge.payment_intent?.id;
        
      if (paymentIntentId) {
        console.log(`Associated payment intent: ${paymentIntentId}`);
        
        try {
          // Get full payment intent details
          const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
          console.log("Payment intent details:", JSON.stringify({
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
            metadata: paymentIntent.metadata || {}
          }));
        } catch (piError) {
          console.error("Error fetching payment intent:", piError);
        }
        
        // Look up our payment record
        const { data: paymentRecord, error: paymentError } = await supabaseClient
          .from("payments")
          .select("*")
          .eq("stripe_payment_id", paymentIntentId)
          .maybeSingle();
          
        if (paymentError) {
          console.error("Error fetching payment record:", paymentError);
        } else if (paymentRecord) {
          console.log("Found matching payment record:", JSON.stringify({
            id: paymentRecord.id,
            status: paymentRecord.status,
            amount_paid: paymentRecord.amount_paid,
            refund_amount: paymentRecord.refund_amount,
            refunded_at: paymentRecord.refunded_at
          }));
          
          // Get balance transaction data for fee information
          if (charge.balance_transaction) {
            try {
              balanceTransactionId = typeof charge.balance_transaction === 'string'
                ? charge.balance_transaction
                : charge.balance_transaction.id;
                
              console.log(`Looking up balance transaction: ${balanceTransactionId}`);
              
              const balanceTransaction = await stripeClient.balanceTransactions.retrieve(balanceTransactionId);
              console.log("Balance transaction details:", JSON.stringify({
                id: balanceTransaction.id,
                amount: balanceTransaction.amount,
                fee: balanceTransaction.fee,
                net: balanceTransaction.net,
                type: balanceTransaction.type,
                available_on: balanceTransaction.available_on,
                status: balanceTransaction.status
              }));
              
              // Extract fee and net amount from the balance transaction
              stripeFee = balanceTransaction.fee || 0;
              netAmount = balanceTransaction.net || 0;
              
              console.log(`Extracted stripe fee: ${stripeFee}, net amount: ${netAmount}`);
              
              // Update the payment record with the fee and net amount information
              const { error: updateError } = await supabaseClient
                .from("payments")
                .update({
                  stripe_refund_fee: stripeFee,
                  net_amount: netAmount,
                  updated_at: new Date().toISOString()
                })
                .eq("id", paymentRecord.id);
                
              if (updateError) {
                console.error("Error updating payment record with fee information:", updateError);
              } else {
                console.log(`Successfully updated payment ${paymentRecord.id} with stripe_refund_fee: ${stripeFee} and net_amount: ${netAmount}`);
              }
            } catch (btError) {
              console.error("Error fetching balance transaction:", btError);
            }
          } else {
            console.log("No balance_transaction found on charge, cannot update fee information");
          }
        } else {
          console.log("No matching payment record found in our database");
        }
      }
    } catch (chargeError) {
      console.error("Error retrieving charge data:", chargeError);
    }
    
    return { 
      status: "success", 
      message: `Refund update for ${refund.id} processed and logged successfully`,
      fee_updated: stripeFee > 0
    };
  } catch (error) {
    console.error("Error processing refund update event:", error);
    console.error("Stack trace:", error.stack);
    return { 
      status: "error", 
      message: `Error processing refund update: ${error.message}` 
    };
  }
}

/**
 * Handle payment intent succeeded event from Stripe
 */
export async function handlePaymentIntentSucceeded(paymentIntent: any, supabaseClient: any) {
  console.log("Payment Intent Succeeded:", JSON.stringify({
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    status: paymentIntent.status
  }));
  
  try {
    // Implementation for handling successful payment intents
    // This would update payment records, send notifications, etc.
    return { 
      status: "success", 
      message: `Payment intent ${paymentIntent.id} processed successfully`
    };
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
    return { 
      status: "error", 
      message: `Error processing payment intent: ${error.message}`
    };
  }
}

/**
 * Handle payment intent failed event from Stripe
 */
export async function handlePaymentIntentFailed(paymentIntent: any, supabaseClient: any) {
  console.log("Payment Intent Failed:", JSON.stringify({
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    status: paymentIntent.status,
    last_payment_error: paymentIntent.last_payment_error
  }));
  
  try {
    // Implementation for handling failed payment intents
    // This would update payment records, notify the user, etc.
    return { 
      status: "success", 
      message: `Failed payment intent ${paymentIntent.id} recorded`
    };
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
    return { 
      status: "error", 
      message: `Error processing failed payment: ${error.message}`
    };
  }
}
