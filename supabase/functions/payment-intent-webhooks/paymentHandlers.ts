
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { generatePaymentReference } from "./utils.ts";
import { NotificationService } from "./notificationService.ts";
import { PlanService } from "./planService.ts";

/**
 * Handle a successful payment intent from Stripe
 */
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

    // Store the original amount in cents as received from Stripe
    const amountInCents = paymentIntent.amount;
    
    // Convert to pounds only for logging purposes
    const amountInPounds = paymentIntent.amount / 100;
    
    console.log(`Payment for clinic: ${clinicId}, amount: ${amountInPounds} (original: ${amountInCents} cents)`);
    
    // CRITICAL - Always use the reference from metadata if provided
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
    
    // Check if a payment record already exists to avoid duplicates
    const { data: existingPayment, error: checkError } = await supabaseClient
      .from("payments")
      .select("id")
      .eq("stripe_payment_id", paymentIntent.id)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for existing payment:", checkError);
    }
    
    if (existingPayment) {
      console.log(`Payment record already exists for payment ID ${paymentIntent.id}`, existingPayment);
      return;
    }
    
    // If this payment is for a payment request, get the associated payment_link_id
    let associatedPaymentLinkId = paymentLinkId;
    let payment_schedule_id = null; // Initialize payment_schedule_id variable
    
    if (requestId) {
      console.log(`Payment is for request ID: ${requestId}, checking for associated payment link...`);
      
      // First check if this payment request is associated with a payment schedule entry
      const { data: scheduleData, error: scheduleError } = await supabaseClient
        .from("payment_schedule")
        .select("id, payment_link_id")
        .eq("payment_request_id", requestId)
        .maybeSingle();
        
      if (scheduleError) {
        console.error("Error fetching payment schedule data:", scheduleError);
      } else if (scheduleData) {
        // If we found a payment schedule entry, store its ID to link directly to the payment
        console.log(`Found payment schedule entry ${scheduleData.id} for payment request ${requestId}`);
        payment_schedule_id = scheduleData.id;
        
        if (scheduleData.payment_link_id) {
          associatedPaymentLinkId = scheduleData.payment_link_id;
          console.log(`Using payment_link_id ${associatedPaymentLinkId} from payment schedule`);
        }
      } else {
        // Fall back to checking the payment request table
        console.log("No payment schedule found, checking payment request table for link ID");
        
        const { data: requestData, error: requestError } = await supabaseClient
          .from("payment_requests")
          .select("payment_link_id")
          .eq("id", requestId)
          .maybeSingle();
          
        if (requestError) {
          console.error("Error fetching payment request data:", requestError);
        } else if (requestData && requestData.payment_link_id) {
          associatedPaymentLinkId = requestData.payment_link_id;
          console.log(`Found associated payment link ID: ${associatedPaymentLinkId} from payment request`);
        } else {
          console.log("No payment link ID found in payment request");
        }
      }
    }
    
    // Prepare payment record data - IMPORTANT: Store all monetary values as cents/pence
    const paymentData = {
      clinic_id: clinicId,
      amount_paid: amountInCents, // Store as integer cents
      paid_at: new Date().toISOString(),
      patient_name: patientName || "Unknown",
      patient_email: patientEmail || null,
      patient_phone: patientPhone || null,
      payment_link_id: associatedPaymentLinkId || null,
      payment_ref: paymentReference,
      status: "paid",
      stripe_payment_id: paymentIntent.id,
      stripe_fee: stripeFeeInCents, // Store as integer (cents)
      net_amount: netAmountInCents, // Store net amount as integer (cents)
      platform_fee: platformFeeInCents, // Store platform fee as integer (cents),
      payment_schedule_id: payment_schedule_id // Add the payment schedule ID if available
    };

    console.log("Inserting payment record:", JSON.stringify(paymentData));
    
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
        
        // Check if this payment is part of a payment plan by looking up in payment_schedule
        try {
          // First, get the payment schedule entry associated with this payment request
          const { data: scheduleData, error: scheduleError } = await supabaseClient
            .from("payment_schedule")
            .select(`
              id, 
              patient_id, 
              payment_link_id, 
              clinic_id,
              payment_number,
              total_payments,
              payment_frequency,
              plan_id
            `)
            .eq("payment_request_id", requestId)
            .single();
            
          if (scheduleError) {
            console.log("No payment schedule entry found for this request, not a payment plan payment");
          } else if (scheduleData) {
            console.log(`Found payment schedule entry: payment ${scheduleData.payment_number} of ${scheduleData.total_payments}`);
            
            // Update the payment schedule status if not already updated
            const { error: updateScheduleError } = await supabaseClient
              .from("payment_schedule")
              .update({ status: "paid" })
              .eq("id", scheduleData.id);
              
            if (updateScheduleError) {
              console.error("Error updating payment schedule status:", updateScheduleError);
            } else {
              console.log("Successfully updated payment schedule status to paid");
            }
            
            // IMPORTANT: Update the parent plan record with new payment status
            await PlanService.updatePlanAfterPayment(
              supabaseClient,
              scheduleData,
              paymentReference,
              amountInCents,
              paymentId
            );
          }
        } catch (scheduleError) {
          console.error("Error checking for payment plan:", scheduleError);
          // Continue with the rest of the payment processing
        }
      }
    }
    
    // Queue notifications for successful payment
    await NotificationService.queuePaymentSuccessNotifications(
      supabaseClient,
      paymentId,
      {
        payment_ref: paymentReference,
        amount_paid: amountInCents,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        clinic_id: clinicId
      },
      {
        stripeFeeInCents,
        platformFeeInCents,
        netAmountInCents
      }
    );

    console.log("Payment processing completed successfully");
  } catch (error) {
    console.error("Error processing payment intent:", error);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

/**
 * Handle a failed payment intent from Stripe
 */
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

    // Queue notifications for the failed payment
    await NotificationService.queuePaymentFailureNotifications(
      supabaseClient,
      {
        clinicId,
        paymentLinkId,
        amount: paymentIntent.amount,
        patientName,
        patientEmail,
        patientPhone
      },
      {
        failureMessage,
        failureCode
      }
    );

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
