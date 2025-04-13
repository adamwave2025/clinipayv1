
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { generatePaymentReference, retryOperation, convertCentsToCurrency, safeLog, validatePaymentIntent, handleDatabaseError } from "./utils.ts";

// Function to handle payment_intent.succeeded events
export async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabaseClient: any) {
  console.log("Processing payment_intent.succeeded:", paymentIntent.id);
  
  try {
    // Log the webhook event start
    await logWebhookEvent(
      supabaseClient,
      paymentIntent.id,
      "payment_intent.succeeded",
      "processing",
      null,
      { metadata: paymentIntent.metadata || {} }
    );
    
    // Validate payment intent data
    validatePaymentIntent(paymentIntent);
    
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    safeLog("Payment intent metadata", metadata);
    
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
      throw new Error("Missing clinicId in payment intent metadata");
    }

    // Log critical payment data for debugging
    console.log(`Payment details:
      ID: ${paymentIntent.id}
      Clinic: ${clinicId}
      Amount: ${paymentIntent.amount / 100}
      Reference: ${existingReference || 'Not provided'}
      Patient: ${patientName || 'Unknown'}
      Link ID: ${paymentLinkId || 'None'}
      Request ID: ${requestId || 'None'}
    `);
    
    // Convert the amount from cents to pounds
    const amountInPounds = convertCentsToCurrency(paymentIntent.amount || 0);
    
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
      handleDatabaseError(checkError, "checking existing payment");
      await logWebhookEvent(
        supabaseClient,
        paymentIntent.id,
        "payment_intent.succeeded",
        "error",
        `Database error checking for existing payment: ${checkError.message}`,
        { error: checkError }
      );
      throw new Error(`Database error checking for existing payment: ${checkError.message}`);
    }
    
    if (existingPayments && existingPayments.length > 0) {
      console.log(`Payment record already exists for payment ${paymentIntent.id}`);
      
      // If there's a request ID, still make sure it's updated
      if (requestId && existingPayments[0]?.id) {
        await updatePaymentRequest(supabaseClient, requestId, existingPayments[0].id);
      }
      
      await logWebhookEvent(
        supabaseClient,
        paymentIntent.id,
        "payment_intent.succeeded",
        "skipped",
        "Payment record already exists",
        { paymentId: existingPayments[0]?.id }
      );
      return;
    }
    
    // Try the simplest approach first - minimal payment insert using RPC function
    let paymentId = null;
    
    try {
      console.log("Attempting minimal payment insert using RPC function");
      
      const { data: minimalResult, error: minimalError } = await supabaseClient.rpc(
        "minimal_payment_insert",
        {
          p_clinic_id: clinicId,
          p_amount_paid: amountInPounds,
          p_stripe_payment_id: paymentIntent.id
        }
      );
      
      if (minimalError) {
        console.error("Minimal insert RPC error:", minimalError);
        await logWebhookEvent(
          supabaseClient,
          paymentIntent.id,
          "payment_intent.succeeded",
          "error",
          `Minimal insert RPC error: ${minimalError.message}`,
          { error: minimalError }
        );
        throw minimalError;
      }
      
      if (minimalResult) {
        paymentId = minimalResult;
        console.log(`Payment record created using minimal insert with ID: ${paymentId}`);
        
        // Now update the payment with additional details in a separate operation
        try {
          const { error: updateError } = await supabaseClient
            .from("payments")
            .update({
              payment_ref: paymentReference,
              patient_name: patientName || "Unknown",
              patient_email: patientEmail || null,
              patient_phone: patientPhone || null,
              payment_link_id: paymentLinkId || null
            })
            .eq("id", paymentId);
            
          if (updateError) {
            console.warn("Warning: Could not update additional payment details:", updateError);
            // Don't throw here, we already have the minimal record created
          }
        } catch (updateErr) {
          console.warn("Warning: Error updating payment details:", updateErr);
          // We continue since we have a basic payment record
        }
      } else {
        console.error("Minimal insert returned no payment ID");
        throw new Error("Minimal insert returned no payment ID");
      }
    } catch (minimalInsertError) {
      console.error("Minimal payment insert failed:", minimalInsertError);
      
      // Fall back to direct insert with only essential fields
      try {
        console.log("Falling back to direct insert with minimal fields");
        
        const { data: directData, error: directError } = await supabaseClient
          .from("payments")
          .insert({
            clinic_id: clinicId,
            amount_paid: amountInPounds,
            status: 'paid',
            stripe_payment_id: paymentIntent.id,
            paid_at: new Date().toISOString()
          })
          .select("id")
          .single();
          
        if (directError) {
          console.error("Direct insert error:", directError);
          await logWebhookEvent(
            supabaseClient,
            paymentIntent.id,
            "payment_intent.succeeded",
            "error",
            `Direct insert error: ${directError.message}`,
            { error: directError }
          );
          throw directError;
        }
        
        paymentId = directData?.id;
        console.log(`Payment record created with direct insert, ID: ${paymentId}`);
        
        // Update with additional details as a separate operation
        try {
          await supabaseClient
            .from("payments")
            .update({
              payment_ref: paymentReference,
              patient_name: patientName || "Unknown"
            })
            .eq("id", paymentId);
        } catch (updateErr) {
          console.warn("Could not update additional payment details:", updateErr);
          // Continue since we have the basic record
        }
      } catch (fallbackError) {
        console.error("All payment insert methods failed:", fallbackError);
        await logWebhookEvent(
          supabaseClient,
          paymentIntent.id,
          "payment_intent.succeeded",
          "failed",
          `All payment insert methods failed: ${fallbackError.message}`,
          { error: fallbackError }
        );
        throw new Error(`Failed to create payment record: ${fallbackError.message}`);
      }
    }
      
    // Update payment request if needed
    if (requestId && paymentId) {
      await updatePaymentRequest(supabaseClient, requestId, paymentId);
    }

    console.log("Payment processing completed successfully");
    await logWebhookEvent(
      supabaseClient,
      paymentIntent.id,
      "payment_intent.succeeded",
      "success",
      null,
      { paymentId }
    );
    
  } catch (error) {
    console.error("Error processing payment intent:", error);
    console.error("Stack trace:", error.stack);
    
    // Log final error state
    try {
      await logWebhookEvent(
        supabaseClient,
        paymentIntent.id,
        "payment_intent.succeeded",
        "failed",
        error.message,
        { stack: error.stack }
      );
    } catch (logError) {
      console.error("Failed to log webhook error:", logError);
    }
    
    throw error;
  }
}

// Helper function to update payment request
async function updatePaymentRequest(supabaseClient, requestId, paymentId) {
  try {
    console.log(`Updating payment request: ${requestId} with payment ID: ${paymentId}`);
    
    // First try using the database function if available
    try {
      const { data: fnResult, error: fnError } = await supabaseClient.rpc(
        "update_payment_request_status",
        {
          p_request_id: requestId,
          p_payment_id: paymentId,
          p_status: "paid"
        }
      );
      
      if (fnError) {
        console.error("Error calling update_payment_request_status function:", fnError);
        throw fnError;
      }
      
      if (fnResult === true) {
        console.log(`Payment request ${requestId} marked as paid using DB function`);
        return;
      }
    } catch (fnError) {
      console.log("DB function for payment request update failed, falling back to direct update");
    }
    
    // Fall back to direct update
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
      handleDatabaseError(requestUpdateError, "updating payment request");
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
    // Log the webhook event start
    await logWebhookEvent(
      supabaseClient,
      paymentIntent.id,
      "payment_intent.payment_failed",
      "processing",
      null,
      { metadata: paymentIntent.metadata || {} }
    );
    
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    const { clinicId, requestId } = metadata;

    if (!clinicId) {
      console.error("Missing clinicId in payment intent metadata");
      return;
    }

    // Log the failure reason
    const failureMessage = paymentIntent.last_payment_error?.message || "Unknown failure reason";
    const failureCode = paymentIntent.last_payment_error?.code || "unknown";
    
    console.log(`Payment failed for clinic: ${clinicId}, reason: ${failureMessage}, code: ${failureCode}`);

    // Update payment attempts table if it exists
    try {
      const { error: attemptError } = await supabaseClient
        .from("payment_attempts")
        .update({
          status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("payment_intent_id", paymentIntent.id);
        
      if (attemptError) {
        console.error("Error updating payment attempt:", attemptError);
      } else {
        console.log(`Payment attempt for ${paymentIntent.id} marked as failed`);
      }
    } catch (attemptError) {
      console.error("Failed to update payment attempt:", attemptError);
    }

    // If this was a payment request, update its status to 'failed'
    if (requestId) {
      try {
        // First try with the function if it exists
        try {
          const { data: fnResult, error: fnError } = await supabaseClient.rpc(
            "update_payment_request_status",
            {
              p_request_id: requestId,
              p_payment_id: null,
              p_status: "failed"
            }
          );
          
          if (fnError) {
            console.error("Error calling update_payment_request_status function:", fnError);
            throw fnError;
          }
          
          if (fnResult === true) {
            console.log(`Payment request ${requestId} marked as failed using DB function`);
            return;
          }
        } catch (fnError) {
          console.log("DB function for payment request update failed, falling back to direct update");
        }
        
        const { error: requestUpdateError } = await retryOperation(async () => {
          return await supabaseClient
            .from("payment_requests")
            .update({
              status: "failed"
            })
            .eq("id", requestId);
        });

        if (requestUpdateError) {
          console.error("Error updating payment request:", requestUpdateError);
          handleDatabaseError(requestUpdateError, "updating payment request status to failed");
        } else {
          console.log(`Payment request ${requestId} marked as failed`);
        }
      } catch (error) {
        console.error("Failed to process payment failure:", error);
      }
    }

    await logWebhookEvent(
      supabaseClient,
      paymentIntent.id,
      "payment_intent.payment_failed",
      "success",
      failureMessage,
      { 
        failureCode,
        requestId
      }
    );
    
    console.log("Failed payment processing completed");
  } catch (error) {
    console.error("Error processing failed payment intent:", error);
    
    // Log final error state
    try {
      await logWebhookEvent(
        supabaseClient,
        paymentIntent.id,
        "payment_intent.payment_failed",
        "error",
        error.message,
        { stack: error.stack }
      );
    } catch (logError) {
      console.error("Failed to log webhook error:", logError);
    }
  }
}

// Helper function to log webhook events to the database
async function logWebhookEvent(
  supabaseClient: any,
  paymentIntentId: string,
  eventType: string,
  status: string,
  errorMessage: string | null = null,
  details: any = null
) {
  try {
    // Try using the RPC function first
    const { data, error } = await supabaseClient.rpc(
      "log_payment_webhook",
      {
        p_event_id: null, // No event ID in this context
        p_event_type: eventType,
        p_payment_intent_id: paymentIntentId,
        p_status: status,
        p_error_message: errorMessage,
        p_details: details ? JSON.stringify(details) : null
      }
    );
    
    if (error) {
      console.error("Error logging webhook event using RPC:", error);
      
      // Fall back to direct insert
      try {
        const { error: insertError } = await supabaseClient
          .from("payment_webhook_logs")
          .insert({
            event_type: eventType,
            payment_intent_id: paymentIntentId,
            status,
            error_message: errorMessage,
            details: details ? JSON.stringify(details) : null
          });
          
        if (insertError) {
          console.error("Error logging webhook event with direct insert:", insertError);
        }
      } catch (directError) {
        console.error("Failed to log webhook event:", directError);
      }
    }
  } catch (e) {
    console.error("Exception logging webhook event:", e);
    // Don't throw here, just log the error to console
  }
}
