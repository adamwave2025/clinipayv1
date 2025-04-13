
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { generatePaymentReference, retryOperation, convertCentsToCurrency, safeLog, validatePaymentIntent, handleDatabaseError } from "./utils.ts";

// Function to handle payment_intent.succeeded events
export async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabaseClient: any) {
  console.log("Processing payment_intent.succeeded:", paymentIntent.id);
  
  try {
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
      throw new Error(`Database error checking for existing payment: ${checkError.message}`);
    }
    
    if (existingPayments && existingPayments.length > 0) {
      console.log(`Payment record already exists for payment ${paymentIntent.id}`);
      
      // If there's a request ID, still make sure it's updated
      if (requestId && existingPayments[0]?.id) {
        await updatePaymentRequest(supabaseClient, requestId, existingPayments[0].id);
      }
      
      return;
    }
    
    // Transaction block to handle payment record insertion
    console.log("Starting transaction for payment record insertion");
    let paymentId = null;
    
    // Try DB function first
    try {
      console.log("Attempting to insert payment using database function");
      
      // Use a direct RPC call to the function we created in the SQL migration
      const { data: fnResult, error: fnError } = await supabaseClient.rpc(
        "insert_payment_record",
        {
          p_clinic_id: clinicId,
          p_amount_paid: amountInPounds,
          p_patient_name: patientName || "Unknown",
          p_patient_email: patientEmail || null,
          p_patient_phone: patientPhone || null,
          p_payment_link_id: paymentLinkId || null,
          p_payment_ref: paymentReference,
          p_stripe_payment_id: paymentIntent.id
        }
      );
      
      if (fnError) {
        handleDatabaseError(fnError, "calling insert_payment_record function");
        throw new Error(`Database function error: ${fnError.message}`);
      }
      
      if (fnResult) {
        paymentId = fnResult;
        console.log(`Payment record created using DB function with ID: ${paymentId}`);
      } else {
        throw new Error("Database function returned no payment ID");
      }
    } catch (fnError) {
      console.error("Database function approach failed:", fnError);
      
      // Fall back to direct insert
      try {
        console.log("Falling back to direct insert into payments table");
        const { data: insertData, error: insertError } = await retryOperation(async () => {
          return await supabaseClient
            .from("payments")
            .insert({
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
            })
            .select("id")
            .single();
        });
        
        if (insertError) {
          handleDatabaseError(insertError, "direct payment insert");
          throw new Error(`Direct insert error: ${insertError.message}`);
        }
        
        paymentId = insertData?.id;
        console.log(`Payment record created successfully with ID: ${paymentId}`);
      } catch (insertError) {
        console.error("Payment record insertion failed:", insertError);
        console.log("Attempting minimal fallback insert...");
        
        // Last resort: Try with minimal fields
        try {
          const { data: minimalData, error: minimalError } = await retryOperation(async () => {
            return await supabaseClient
              .from("payments")
              .insert({
                clinic_id: clinicId,
                amount_paid: amountInPounds,
                status: 'paid',
                stripe_payment_id: paymentIntent.id
              })
              .select("id")
              .single();
          });
          
          if (minimalError) {
            handleDatabaseError(minimalError, "minimal payment insert");
            console.error("All insertion attempts failed:", minimalError);
            throw new Error(`Could not create payment record after multiple attempts: ${minimalError.message}`);
          }
          
          paymentId = minimalData?.id;
          console.log(`Created minimal payment record with ID: ${paymentId}`);
        } catch (finalError) {
          console.error("Final fallback insertion also failed:", finalError);
          // At this point we've tried everything, log the comprehensive error
          throw new Error(`All payment record insertion methods failed: ${finalError.message}`);
        }
      }
    }
      
    // Update payment request if needed
    if (requestId && paymentId) {
      await updatePaymentRequest(supabaseClient, requestId, paymentId);
    }

    console.log("Payment processing completed successfully");
    
    // Additional verification to ensure payment was actually recorded
    const { data: verifyPayment, error: verifyError } = await supabaseClient
      .from("payments")
      .select("id")
      .eq("id", paymentId)
      .single();
      
    if (verifyError || !verifyPayment) {
      console.error("Payment verification failed after insert:", verifyError || "No payment found");
    } else {
      console.log("Payment record verified successfully:", verifyPayment.id);
    }
    
  } catch (error) {
    console.error("Error processing payment intent:", error);
    console.error("Stack trace:", error.stack);
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

    console.log("Failed payment processing completed");
  } catch (error) {
    console.error("Error processing failed payment intent:", error);
    // This is already an error handler, so we don't rethrow
  }
}
