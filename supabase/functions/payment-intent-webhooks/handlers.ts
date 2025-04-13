
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { generatePaymentReference } from "./utils.ts";

// Simple retry mechanism for database operations
async function retryOperation(operation, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        // Increase delay for next attempt (exponential backoff)
        delayMs *= 2;
      }
    }
  }
  
  throw lastError;
}

// Function to handle payment_intent.succeeded events
export async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabaseClient: any) {
  console.log("Processing payment_intent.succeeded:", paymentIntent.id);
  
  try {
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    const {
      clinicId,
      paymentLinkId,
      requestId,
      paymentReference: existingReference,
      patientName,
      patientEmail,
      patientPhone,
    } = metadata;

    if (!clinicId) {
      console.error("Missing clinicId in payment intent metadata");
      return;
    }

    // Convert the amount from cents to pounds
    const amountInPounds = (paymentIntent.amount || 0) / 100;
    
    console.log(`Payment for clinic: ${clinicId}, amount: ${amountInPounds}`);
    
    // Generate a payment reference if one doesn't exist
    const paymentReference = existingReference || generatePaymentReference();
    console.log(`Using payment reference: ${paymentReference}`);
    
    // Check if there's already a payment record for this payment intent
    const { data: existingPayments, error: checkError } = await supabaseClient
      .from("payments")
      .select("id")
      .eq("stripe_payment_id", paymentIntent.id);
      
    if (checkError) {
      console.error("Error checking for existing payment:", checkError);
      throw new Error(`Database error checking for existing payment: ${checkError.message}`);
    }
    
    if (existingPayments && existingPayments.length > 0) {
      console.log(`Payment record already exists for payment ${paymentIntent.id}`);
      return;
    }
    
    // Try to insert using the RPC function
    try {
      console.log("Using RPC to insert payment record");
      const { data: rpcData, error: rpcError } = await retryOperation(async () => {
        return await supabaseClient.rpc('insert_payment_record', {
          p_clinic_id: clinicId,
          p_amount_paid: amountInPounds,
          p_patient_name: patientName || "Unknown",
          p_patient_email: patientEmail || null,
          p_patient_phone: patientPhone || null,
          p_payment_link_id: paymentLinkId || null,
          p_payment_ref: paymentReference,
          p_stripe_payment_id: paymentIntent.id
        });
      });

      if (rpcError) {
        throw new Error(`RPC error: ${rpcError.message}`);
      }

      const paymentId = rpcData;
      console.log(`Payment record created with ID: ${paymentId}`);
      
      // Update payment request if needed
      if (requestId && paymentId) {
        await updatePaymentRequest(supabaseClient, requestId, paymentId);
      }
      
    } catch (rpcError) {
      console.error("RPC insertion failed with error:", rpcError);
      console.log("Attempting direct insertion as fallback...");
      
      // Fallback: Direct insertion if RPC fails
      const { data: directData, error: directError } = await retryOperation(async () => {
        return await supabaseClient.from("payments").insert({
          clinic_id: clinicId,
          amount_paid: amountInPounds,
          paid_at: new Date().toISOString(),
          patient_name: patientName || "Unknown",
          patient_email: patientEmail || null,
          patient_phone: patientPhone || null,
          payment_link_id: paymentLinkId || null,
          payment_ref: paymentReference,
          status: 'paid',
          stripe_payment_id: paymentIntent.id
        }).select("id").single();
      });

      if (directError) {
        throw new Error(`Direct insertion error: ${directError.message}`);
      }

      const paymentId = directData?.id;
      console.log(`Payment record created via direct insertion with ID: ${paymentId}`);
      
      // Update payment request if needed
      if (requestId && paymentId) {
        await updatePaymentRequest(supabaseClient, requestId, paymentId);
      }
    }

    console.log("Payment processing completed successfully");
  } catch (error) {
    console.error("Error processing payment intent:", error);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

// Helper function to update payment request
async function updatePaymentRequest(supabaseClient, requestId, paymentId) {
  try {
    console.log(`Updating payment request: ${requestId}`);
    
    const { error: requestUpdateError } = await retryOperation(async () => {
      return await supabaseClient
        .from("payment_requests")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_id: paymentId
        })
        .eq("id", requestId);
    });

    if (requestUpdateError) {
      console.error("Error updating payment request:", requestUpdateError);
    } else {
      console.log(`Payment request ${requestId} marked as paid`);
    }
  } catch (requestError) {
    console.error("Failed to update payment request:", requestError);
    // We don't rethrow this error as it's not critical to the payment record
  }
}

// Function to handle payment_intent.payment_failed events
export async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabaseClient: any) {
  console.log("Processing payment_intent.payment_failed:", paymentIntent.id);
  
  try {
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    const { clinicId, paymentLinkId, requestId } = metadata;

    if (!clinicId) {
      console.error("Missing clinicId in payment intent metadata");
      return;
    }

    // Log the failure reason
    const failureMessage = paymentIntent.last_payment_error?.message || "Unknown failure reason";
    const failureCode = paymentIntent.last_payment_error?.code || "unknown";
    
    console.log(`Payment failed for clinic: ${clinicId}, reason: ${failureMessage}, code: ${failureCode}`);
    
    // Update payment attempt if exists - with minimal operation
    if (paymentIntent.id) {
      try {
        const { error: attemptUpdateError } = await retryOperation(async () => {
          return await supabaseClient
            .from("payment_attempts")
            .update({
              status: "failed",
              updated_at: new Date().toISOString()
            })
            .eq("payment_intent_id", paymentIntent.id);
        });

        if (attemptUpdateError) {
          console.error("Error updating payment attempt:", attemptUpdateError);
        } else {
          console.log(`Payment attempt updated to failed for intent ${paymentIntent.id}`);
        }
      } catch (error) {
        console.error("Failed to update payment attempt:", error);
        // Non-critical error, continue execution
      }
    }

    console.log("Failed payment processing completed");
  } catch (error) {
    console.error("Error processing failed payment intent:", error);
    // This is already an error handler, so we don't rethrow
  }
}
