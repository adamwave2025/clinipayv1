
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
    
    // Initialize fee data variables
    let stripeFeeInCents = 0; // Store as cents for the database
    let netAmountInCents = 0; // Store the net amount in cents
    let platformFeeInCents = 0; // Store the platform fee in cents
    
    // Fetch Stripe fee data from charge and balance transaction
    if (paymentIntent.latest_charge) {
      try {
        console.log(`Retrieving charge data for charge ID: ${paymentIntent.latest_charge}`);
        
        // Initialize Stripe with proper import
        const stripe = new Stripe(Deno.env.get("SECRET_KEY") ?? "", {
          apiVersion: "2023-10-16",
        });
        
        // Retrieve charge data
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        
        if (charge && charge.balance_transaction) {
          console.log(`Retrieving balance transaction data for ID: ${charge.balance_transaction}`);
          
          // Retrieve balance transaction data
          const balanceTransaction = await stripe.balanceTransactions.retrieve(
            typeof charge.balance_transaction === 'string' 
              ? charge.balance_transaction 
              : charge.balance_transaction.id
          );
          
          if (balanceTransaction) {
            // Extract fee data (keeping as cents for DB storage)
            stripeFeeInCents = balanceTransaction.fee || 0;
            const stripeFeeInPounds = stripeFeeInCents / 100; // Just for logging
            
            // Extract and store the net amount (keeping as cents for DB storage)
            netAmountInCents = balanceTransaction.net || 0;
            const netAmountInPounds = netAmountInCents / 100; // For logging
            
            console.log(`Stripe fees: £${stripeFeeInPounds.toFixed(2)}, Net amount: £${netAmountInPounds.toFixed(2)}`);
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
              // Store platform fee as cents for DB consistency
              platformFeeInCents = appFee.amount || 0;
              const platformFeeInPounds = platformFeeInCents / 100; // Just for logging
              
              console.log(`Platform fee: £${platformFeeInPounds.toFixed(2)}`);
            }
          } catch (appFeeError) {
            console.error("Error retrieving application fee data:", appFeeError);
            console.error("Continuing without platform fee data");
          }
        } else {
          console.log("No application_fee found on charge");
        }
      } catch (feeError) {
        // Log the error but don't prevent payment processing
        console.error("Error retrieving fee data from Stripe:", feeError);
        console.error("Continuing with payment processing without fee data");
      }
    }
    
    // Prepare payment record data
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
      stripe_payment_id: paymentIntent.id,
      stripe_fee: stripeFeeInCents, // Store as integer (cents)
      net_amount: netAmountInCents, // Store net amount as integer (cents)
      platform_fee: platformFeeInCents, // Store platform fee as integer (cents)
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
    
    // Get clinic data for notifications
    const { data: clinicData, error: clinicError } = await supabaseClient
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();
      
    if (clinicError) {
      console.error("Error fetching clinic data:", clinicError);
      console.error("Continuing without clinic data");
    }
    
    // Add notifications to queue instead of trying to send them directly
    // Queue patient notification for successful payment if we have contact details
    if (patientEmail || patientPhone) {
      try {
        // Create notification payload for patient with new structure
        const patientPayload = {
          notification_type: "payment_success",
          notification_method: {
            email: clinicData?.email_notifications ?? true,
            sms: clinicData?.sms_notifications ?? true
          },
          patient: {
            name: patientName || 'Patient',
            email: patientEmail,
            phone: patientPhone
          },
          payment: {
            reference: paymentReference,
            amount: amountInPounds,
            refund_amount: null,
            payment_link: `https://clinipay.co.uk/payment-receipt/${paymentId}`,
            message: "Your payment was successful"
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your healthcare provider',
            email: clinicData?.email,
            phone: clinicData?.phone
          }
        };
        
        // Add to notification queue for patient
        const { error: notifyError } = await supabaseClient
          .from("notification_queue")
          .insert({
            type: 'payment_success',
            payload: patientPayload,
            payment_id: paymentId,
            recipient_type: 'patient'
          });
          
        if (notifyError) {
          console.error(`Error queueing patient notification: ${notifyError.message}`);
          console.error("Error details:", JSON.stringify(notifyError));
        } else {
          console.log(`Successfully queued payment success notification for patient`);
        }
        
        // Queue clinic notification as well
        const clinicPayload = {
          notification_type: "payment_success",
          notification_method: {
            email: clinicData?.email_notifications ?? true,
            sms: clinicData?.sms_notifications ?? true
          },
          patient: {
            name: patientName || 'Anonymous',
            email: patientEmail,
            phone: patientPhone
          },
          payment: {
            reference: paymentReference,
            amount: amountInPounds,
            refund_amount: null,
            payment_link: `https://clinipay.co.uk/payment-receipt/${paymentId}`,
            message: "Payment received successfully",
            financial_details: {
              gross_amount: amountInPounds,
              stripe_fee: stripeFeeInCents / 100, // Convert from cents to pounds
              platform_fee: platformFeeInCents / 100, // Convert from cents to pounds
              net_amount: netAmountInCents / 100 // Convert from cents to pounds
            }
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your clinic',
            email: clinicData?.email,
            phone: clinicData?.phone
          }
        };
        
        const { error: clinicNotifyError } = await supabaseClient
          .from("notification_queue")
          .insert({
            type: 'payment_success',
            payload: clinicPayload,
            payment_id: paymentId,
            recipient_type: 'clinic'
          });
          
        if (clinicNotifyError) {
          console.error(`Error queueing clinic notification: ${clinicNotifyError.message}`);
          console.error("Error details:", JSON.stringify(clinicNotifyError));
        } else {
          console.log(`Successfully queued payment notification for clinic`);
        }
      } catch (notifyErr) {
        console.error(`Error in notification processing: ${notifyErr.message}`);
        // Don't rethrow, just log the error - this shouldn't affect the main payment processing
      }
    }

    console.log("Payment processing completed successfully");
  } catch (error) {
    console.error("Error processing payment intent:", error);
    console.error("Stack trace:", error.stack);
    throw error;
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

    // Get clinic data for notifications
    const { data: clinicData, error: clinicError } = await supabaseClient
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();
      
    if (clinicError) {
      console.error("Error fetching clinic data:", clinicError);
      console.error("Continuing without clinic data");
    }

    // If we have patient contact information, queue a failure notification
    if (patientEmail || patientPhone) {
      try {
        // Create notification payload for payment failure with new structure
        const failurePayload = {
          notification_type: "payment_failed",
          notification_method: {
            email: clinicData?.email_notifications ?? true,
            sms: clinicData?.sms_notifications ?? true
          },
          patient: {
            name: patientName || 'Patient',
            email: patientEmail,
            phone: patientPhone
          },
          payment: {
            reference: "N/A",
            amount: paymentIntent.amount / 100,
            refund_amount: null,
            payment_link: paymentLinkId ? `https://clinipay.co.uk/payment/${paymentLinkId}` : null,
            message: `Your payment has failed: ${failureMessage}`
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your healthcare provider',
            email: clinicData?.email,
            phone: clinicData?.phone
          },
          error: {
            message: failureMessage,
            code: failureCode
          }
        };
        
        // Add to notification queue
        const { error: notifyError } = await supabaseClient
          .from("notification_queue")
          .insert({
            type: 'payment_failed',
            payload: failurePayload,
            recipient_type: 'patient'
          });
          
        if (notifyError) {
          console.error(`Error queueing payment failure notification: ${notifyError.message}`);
          console.error("Error details:", JSON.stringify(notifyError));
        } else {
          console.log(`Successfully queued payment failure notification for patient`);
        }
      } catch (notifyErr) {
        console.error(`Error in notification processing: ${notifyErr.message}`);
        // Don't rethrow, just log the error
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
