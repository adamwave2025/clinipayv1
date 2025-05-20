
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


export async function handleRefundDotUpdated(refund: any, stripeClient: Stripe, supabaseClient: any) {
  console.log("Processing refund.updated event:", refund.id);
  
  try {
    // Log detailed refund object (excluding potentially large fields)
    console.log("Refund details:", JSON.stringify({
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      charge: refund.charge,
      created: refund.created,
      failure_reason: refund.failure_reason,
      metadata: refund.metadata,
      payment_intent: refund.payment_intent
    }, null, 2));
    
    // Initialize variable to store refund fee
    let refundFee = 0;
    let paymentIntentId = null;
    
    if (refund.charge) {
      try {
        // Retrieve and log charge details
        const charge = await stripeClient.charges.retrieve(refund.charge);
        console.log("Charge details:", JSON.stringify({
          id: charge.id,
          amount: charge.amount,
          currency: charge.currency,
          payment_method: charge.payment_method,
          payment_method_details: charge.payment_method_details,
          status: charge.status,
          paid: charge.paid,
          refunded: charge.refunded,
          amount_refunded: charge.amount_refunded,
          failure_code: charge.failure_code,
          failure_message: charge.failure_message
        }, null, 2));
        
        // Get payment intent ID from charge
        if (charge.payment_intent) {
          paymentIntentId = typeof charge.payment_intent === 'string' 
            ? charge.payment_intent 
            : charge.payment_intent.id;
          console.log(`Found payment intent: ${paymentIntentId}`);
        }
        
        // If there's a balance transaction, retrieve and log it
        if (charge.balance_transaction && typeof charge.balance_transaction === 'string') {
          try {
            const balanceTransaction = await stripeClient.balanceTransactions.retrieve(
              charge.balance_transaction
            );
            console.log("Balance transaction details:", JSON.stringify({
              id: balanceTransaction.id,
              amount: balanceTransaction.amount,
              net: balanceTransaction.net,
              fee: balanceTransaction.fee,
              fee_details: balanceTransaction.fee_details,
              status: balanceTransaction.status,
              type: balanceTransaction.type,
              available_on: balanceTransaction.available_on
            }, null, 2));
            
            // Extract the fee from the balance transaction
            refundFee = balanceTransaction.fee || 0;
            console.log(`Extracted refund fee from balance transaction: ${refundFee}`);
          } catch (balanceError) {
            console.error("Error retrieving balance transaction:", balanceError);
          }
        }
      } catch (chargeError) {
        console.error("Error retrieving charge details:", chargeError);
      }
    }
    
    // Check for balance transaction directly on refund if it exists
    if (refund.balance_transaction && typeof refund.balance_transaction === 'string') {
      try {
        const refundBalanceTransaction = await stripeClient.balanceTransactions.retrieve(
          refund.balance_transaction
        );
        console.log("Refund balance transaction details:", JSON.stringify({
          id: refundBalanceTransaction.id,
          amount: refundBalanceTransaction.amount,
          net: refundBalanceTransaction.net,
          fee: refundBalanceTransaction.fee,
          fee_details: refundBalanceTransaction.fee_details,
          status: refundBalanceTransaction.status,
          type: refundBalanceTransaction.type
        }, null, 2));
      } catch (refundBalanceError) {
        console.error("Error retrieving refund balance transaction:", refundBalanceError);
      }
    }
    
    // Update the payments table with the refund fee if we have a payment intent ID
    if (paymentIntentId) {
      const { data: paymentData, error: paymentError } = await supabaseClient
        .from("payments")
        .select("id")
        .eq("stripe_payment_id", paymentIntentId)
        .maybeSingle();
        
      if (paymentError) {
        console.error("Error finding payment record:", paymentError);
      } else if (paymentData) {
        console.log(`Found payment record: ${paymentData.id}, updating with refund fee: ${refundFee}`);
        
        const { error: updateError } = await supabaseClient
          .from("payments")
          .update({ 
            stripe_refund_fee: refundFee,
            stripe_refund_id: refund.id
          })
          .eq("id", paymentData.id);
          
        if (updateError) {
          console.error("Error updating payment with refund fee:", updateError);
        } else {
          console.log(`Successfully updated payment ${paymentData.id} with refund fee ${refundFee}`);
        }
      } else {
        console.error(`No payment record found for payment intent: ${paymentIntentId}`);
      }
    } else {
      console.error("No payment intent ID found, cannot update payment record");
    }
    
    // Return a simple response for now
    return { 
      status: "logged", 
      refundId: refund.id,
      refundFee: refundFee,
      paymentUpdated: !!paymentIntentId
    };
    
  } catch (error) {
    console.error("Error in handleRefundDotUpdated:", error);
    return { status: "error", message: error.message };
  }
}
