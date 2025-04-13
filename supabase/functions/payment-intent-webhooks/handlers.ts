
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
  
  if (!paymentIntent || !paymentIntent.id) {
    console.error("Invalid payment intent received");
    return;
  }
  
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
    const amountInPounds = (paymentIntent.amount || 0) / 100;
    
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
      
      // If there's a request ID, still make sure it's updated
      if (requestId && existingPayments[0]?.id) {
        await updatePaymentRequest(supabaseClient, requestId, existingPayments[0].id);
      }
      
      return;
    }
    
    // Try to insert using the RPC function with careful error handling
    let paymentId = null;
    try {
      console.log("Calling insert_payment_record RPC function");
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

      paymentId = rpcData;
      console.log(`Payment record created with ID: ${paymentId}`);
    } catch (rpcError) {
      console.error("RPC insertion failed with error:", rpcError);
      console.log("Attempting direct insertion as fallback...");
      
      // Fallback: Direct insertion if RPC fails
      try {
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

        paymentId = directData?.id;
        console.log(`Payment record created via direct insertion with ID: ${paymentId}`);
      } catch (directError) {
        console.error("Both RPC and direct insertion failed:", directError);
        console.log("Attempting minimal insertion as last resort...");
        
        // Last resort: Insert with minimal fields if all else fails
        const { data: minimalData, error: minimalError } = await retryOperation(async () => {
          return await supabaseClient.from("payments").insert({
            clinic_id: clinicId,
            amount_paid: amountInPounds,
            status: 'paid',
            stripe_payment_id: paymentIntent.id
          }).select("id").single();
        });
        
        if (minimalError) {
          console.error("All insertion attempts failed:", minimalError);
          throw new Error("Could not create payment record after multiple attempts");
        }
        
        paymentId = minimalData?.id;
        console.log(`Created minimal payment record with ID: ${paymentId}`);
      }
    }
      
    // Update payment request if needed
    if (requestId && paymentId) {
      await updatePaymentRequest(supabaseClient, requestId, paymentId);
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
    console.log(`Updating payment request: ${requestId} with payment ID: ${paymentId}`);
    
    // First try using the RPC function
    try {
      const { error: rpcError } = await retryOperation(async () => {
        return await supabaseClient.rpc('update_payment_request_status', {
          p_request_id: requestId,
          p_payment_id: paymentId,
          p_status: 'paid'
        });
      });
      
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      
      console.log(`Payment request ${requestId} updated via RPC function`);
      return;
    } catch (rpcError) {
      console.log("RPC update failed, falling back to direct update:", rpcError.message);
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

    // If this was a payment request, update its status to 'failed'
    if (requestId) {
      try {
        // First try using the RPC function
        try {
          const { error: rpcError } = await retryOperation(async () => {
            return await supabaseClient.rpc('update_payment_request_status', {
              p_request_id: requestId,
              p_payment_id: null,
              p_status: 'failed'
            });
          });
          
          if (rpcError) {
            throw new Error(rpcError.message);
          }
          
          console.log(`Payment request ${requestId} marked as failed via RPC function`);
          return;
        } catch (rpcError) {
          console.log("RPC update failed, falling back to direct update:", rpcError.message);
        }
        
        // Fall back to direct update
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
