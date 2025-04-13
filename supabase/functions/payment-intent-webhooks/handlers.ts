import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { generatePaymentReference } from "./utils.ts";

// Function to handle payment_intent.succeeded events
export async function handlePaymentIntentSucceeded(paymentIntent: any, supabaseClient: any) {
  console.log("Processing payment_intent.succeeded:", paymentIntent.id);
  console.log("Payment intent details:", JSON.stringify({
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    status: paymentIntent.status,
    metadata: paymentIntent.metadata || {}
  }));
  
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

    // Convert the amount from cents to pounds with precision
    const amountInPounds = paymentIntent.amount / 100;
    
    console.log(`Payment for clinic: ${clinicId}, amount: ${amountInPounds} (original: ${paymentIntent.amount} cents)`);
    
    // Generate a payment reference if one doesn't exist
    const paymentReference = existingReference || generatePaymentReference();
    console.log(`Using payment reference: ${paymentReference}`);
    
    // Prepare payment record data - simplified to avoid timeouts
    const paymentData = {
      clinic_id: clinicId,
      amount_paid: amountInPounds,
      paid_at: new Date().toISOString(),
      patient_name: patientName || "Unknown",
      patient_email: patientEmail || null,
      patient_phone: patientPhone || null,
      payment_link_id: paymentLinkId || null,
      payment_ref: paymentReference,
      status: "paid",
      stripe_payment_id: paymentIntent.id
    };

    console.log("Attempting to insert payment record:", JSON.stringify(paymentData));
    
    // Record the payment in the payments table
    const { data, error } = await supabaseClient
      .from("payments")
      .insert(paymentData)
      .select();

    if (error) {
      console.error("Error inserting payment record:", error);
      console.error("Error details:", JSON.stringify(error));
      throw new Error(`Error recording payment: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error("No data returned from payment insert operation");
      throw new Error("Payment record was not created properly");
    }

    const paymentId = data[0].id;
    console.log(`Payment record created with ID: ${paymentId}`);

    // If this payment was for a payment request, update the request status
    if (requestId) {
      console.log(`Updating payment request: ${requestId}`);
      
      const { error: requestUpdateError } = await supabaseClient
        .from("payment_requests")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_id: paymentId
        })
        .eq("id", requestId);

      if (requestUpdateError) {
        console.error("Error updating payment request:", requestUpdateError);
        console.error("Error details:", JSON.stringify(requestUpdateError));
        // Don't throw error here, we already recorded the payment
      } else {
        console.log(`Payment request ${requestId} marked as paid`);
      }
    }

    console.log("Payment processing completed successfully");
    
    // After successful payment record creation, fetch Stripe fee data asynchronously
    // This happens outside the critical path and won't block payment creation
    try {
      if (paymentIntent.latest_charge) {
        console.log(`Will fetch fee data for charge ID: ${paymentIntent.latest_charge} in a separate operation`);
        updatePaymentWithFeeData(paymentId, paymentIntent.latest_charge, supabaseClient);
      }
    } catch (feeError) {
      console.error("Error setting up fee data retrieval:", feeError);
      // Don't throw the error - the payment is already recorded
    }
    
    return { success: true, paymentId };
  } catch (error) {
    console.error("Error processing payment intent:", error);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

// Separate function to update the payment record with fee data
// This runs after the payment is already recorded, so timeouts here won't affect payment creation
async function updatePaymentWithFeeData(paymentId: string, chargeId: string, supabaseClient: any) {
  try {
    console.log(`Retrieving charge data for charge ID: ${chargeId}`);
    
    // Initialize Stripe with proper import
    const stripe = new Stripe(Deno.env.get("SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });
    
    // Retrieve charge data
    const charge = await stripe.charges.retrieve(chargeId);
    
    let stripeFeeInCents = 0;
    let netAmountInCents = 0;
    let platformFeeInCents = 0;
    
    if (charge && charge.balance_transaction) {
      console.log(`Retrieving balance transaction data for ID: ${charge.balance_transaction}`);
      
      // Retrieve balance transaction data
      const balanceTransaction = await stripe.balanceTransactions.retrieve(
        typeof charge.balance_transaction === 'string' 
          ? charge.balance_transaction 
          : charge.balance_transaction.id
      );
      
      if (balanceTransaction) {
        // Extract fee data
        stripeFeeInCents = balanceTransaction.fee || 0;
        netAmountInCents = balanceTransaction.net || 0;
        
        console.log(`Stripe fees: ${stripeFeeInCents/100}, Net amount: ${netAmountInCents/100}`);
      }
    }
    
    // Check if charge has application_fee
    if (charge && charge.application_fee) {
      console.log(`Retrieving application fee data for ID: ${charge.application_fee}`);
      
      try {
        // Retrieve the application fee details
        const appFee = await stripe.applicationFees.retrieve(
          typeof charge.application_fee === 'string'
            ? charge.application_fee
            : charge.application_fee.id
        );
        
        if (appFee) {
          platformFeeInCents = appFee.amount || 0;
          console.log(`Platform fee: ${platformFeeInCents/100}`);
        }
      } catch (appFeeError) {
        console.error("Error retrieving application fee data:", appFeeError);
      }
    }
    
    // Update the payment record with fee data
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({
        stripe_fee: stripeFeeInCents,
        net_amount: netAmountInCents,
        platform_fee: platformFeeInCents
      })
      .eq("id", paymentId);
      
    if (updateError) {
      console.error("Error updating payment with fee data:", updateError);
    } else {
      console.log(`Successfully updated payment ${paymentId} with fee data`);
    }
    
  } catch (error) {
    console.error("Error in updatePaymentWithFeeData:", error);
    // Don't throw the error - this is a non-critical update
  }
}

// Function to handle payment_intent.payment_failed events
export async function handlePaymentIntentFailed(paymentIntent: any, supabaseClient: any) {
  console.log("Processing payment_intent.payment_failed:", paymentIntent.id);
  console.log("Failed payment intent details:", JSON.stringify({
    id: paymentIntent.id,
    status: paymentIntent.status,
    error: paymentIntent.last_payment_error,
    metadata: paymentIntent.metadata || {}
  }));
  
  try {
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    const {
      clinicId,
      paymentLinkId,
      requestId,
      patientName,
      patientEmail,
      patientPhone,
    } = metadata;

    if (!clinicId) {
      console.error("Missing clinicId in payment intent metadata");
      return;
    }

    // Log the failure reason
    const failureMessage = paymentIntent.last_payment_error?.message || "Unknown failure reason";
    const failureCode = paymentIntent.last_payment_error?.code || "unknown";
    
    console.log(`Payment failed for clinic: ${clinicId}, reason: ${failureMessage}, code: ${failureCode}`);
    
    // Update payment attempt if exists
    if (paymentIntent.id) {
      const { error: attemptUpdateError } = await supabaseClient
        .from("payment_attempts")
        .update({
          status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("payment_intent_id", paymentIntent.id);

      if (attemptUpdateError) {
        console.error("Error updating payment attempt:", attemptUpdateError);
        console.error("Error details:", JSON.stringify(attemptUpdateError));
      } else {
        console.log(`Payment attempt updated to failed for intent ${paymentIntent.id}`);
      }
    }

    // If this payment was for a payment request, we might want to update it
    if (requestId) {
      console.log(`Payment failed for request: ${requestId}`);
      // You may choose to update the payment request status here if needed
    }

    console.log("Failed payment processing completed");
  } catch (error) {
    console.error("Error processing failed payment intent:", error);
    console.error("Stack trace:", error.stack);
  }
}
