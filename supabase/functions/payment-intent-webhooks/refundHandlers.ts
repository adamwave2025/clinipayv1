
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

}
