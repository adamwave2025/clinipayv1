
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log("🔄 Refund process started");
    
    // Parse request body and log data for debugging
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("📥 Request body:", JSON.stringify(requestBody));
    } catch (err) {
      console.error("❌ Error parsing request body:", err);
      throw new Error("Invalid refund request format.");
    }

    const { paymentId, refundAmount, fullRefund } = requestBody;

    if (!paymentId) {
      console.error("❌ Missing payment ID in request");
      throw new Error("Missing payment ID.");
    }

    // Get Stripe secret key from environment variables
    const stripeSecretKey = Deno.env.get("SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("❌ Missing Stripe secret key in environment variables");
      throw new Error("Payment processing is not configured properly. Please contact support.");
    }

    console.log(`🧾 Processing refund for payment ${paymentId}, amount: ${refundAmount}, fullRefund: ${fullRefund}`);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16"
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase credentials in environment variables");
      throw new Error("Database connection not configured. Please contact support.");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the payment record from database
    console.log(`🔍 Fetching payment record with ID: ${paymentId}`);
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError) {
      console.error("❌ Error fetching payment:", paymentError);
      throw new Error(`Payment not found: ${paymentError.message}`);
    }

    if (!payment) {
      console.error("❌ Payment record not found in database");
      throw new Error("Payment not found in database.");
    }

    console.log(`✅ Payment record retrieved: ${JSON.stringify(payment)}`);

    // Check if payment has Stripe payment ID
    if (!payment.stripe_payment_id) {
      console.error("❌ Missing Stripe payment ID in payment record");
      throw new Error("This payment does not have a Stripe payment ID.");
    }

    const stripePaymentId = payment.stripe_payment_id;

    // Process refund via Stripe
    let stripeRefund;
    let refundFeeInCents = 0;  // Variable to store the refund fee
    
    try {
      console.log(`💳 Creating Stripe refund for payment intent: ${stripePaymentId}`);
      
      // Create refund with reverse_transfer and refund_application_fee parameters
      // This ensures the money is pulled from the connected account and the platform fee is refunded
      stripeRefund = await stripe.refunds.create({
        payment_intent: stripePaymentId,
        amount: fullRefund ? undefined : Math.round(refundAmount * 100), // Convert to cents for Stripe if partial refund
        refund_application_fee: true,
        reverse_transfer: true
      });
      
      console.log(`✅ Stripe refund created with ID: ${stripeRefund.id}`);
      
      // After successful refund, try to retrieve the balance transaction to get the refund fee
      if (stripeRefund.balance_transaction) {
        try {
          console.log(`🔍 Retrieving balance transaction for refund: ${stripeRefund.balance_transaction}`);
          
          // Get the balance transaction data
          const balanceTransaction = await stripe.balanceTransactions.retrieve(
            typeof stripeRefund.balance_transaction === 'string' 
              ? stripeRefund.balance_transaction 
              : stripeRefund.balance_transaction.id
          );
          
          // Extract the fee (in cents)
          if (balanceTransaction && balanceTransaction.fee) {
            refundFeeInCents = balanceTransaction.fee;
            console.log(`💰 Stripe refund fee: ${refundFeeInCents} cents (${refundFeeInCents / 100} GBP)`);
          } else {
            console.log(`⚠️ No fee found in balance transaction`);
          }
        } catch (feeError) {
          // Log the error but continue with the refund process
          console.error(`⚠️ Error retrieving refund fee from balance transaction:`, feeError);
          console.error(`Continuing with refund process without fee information`);
        }
      } else {
        console.log(`⚠️ No balance transaction found in refund response`);
      }
    } catch (stripeError) {
      console.error("❌ Stripe refund error:", stripeError);
      // Log detailed Stripe error information
      if (stripeError.type) {
        console.error(`Stripe error type: ${stripeError.type}`);
      }
      if (stripeError.code) {
        console.error(`Stripe error code: ${stripeError.code}`);
      }
      if (stripeError.raw) {
        console.error(`Stripe raw error: ${JSON.stringify(stripeError.raw)}`);
      }
      throw new Error(`Stripe refund failed: ${stripeError.message}`);
    }

    // Determine if this is a full refund by comparing amounts with a small epsilon
    // for floating point comparison
    const epsilon = 0.001; // Small value to account for floating point precision issues
    
    // If the fullRefund flag is explicitly set, respect it
    // Otherwise, calculate based on amount comparison
    let isFullRefund = fullRefund;
    
    if (!isFullRefund && refundAmount) {
      // Calculate if this is a full refund by comparing amounts
      isFullRefund = Math.abs(payment.amount_paid - refundAmount) < epsilon;
      console.log(`🧮 Full refund calculation: Payment amount=${payment.amount_paid}, Refund amount=${refundAmount}, Difference=${Math.abs(payment.amount_paid - refundAmount)}, isFullRefund=${isFullRefund}`);
    }

    // Update payment record in database
    const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';
    const refundAmountToStore = isFullRefund ? payment.amount_paid : refundAmount;
    const currentTimestamp = new Date().toISOString();
    
    console.log(`💾 Updating payment record to status: ${newStatus} (isFullRefund: ${isFullRefund})`);
    const updateData = {
      status: newStatus,
      refund_amount: refundAmountToStore,
      refunded_at: currentTimestamp,
      stripe_refund_id: stripeRefund.id,
      stripe_refund_fee: refundFeeInCents  // Add the refund fee to the update data
    };

    console.log(`📦 Update data: ${JSON.stringify(updateData)}`);
    
    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    if (updateError) {
      console.error("❌ Error updating payment record:", updateError);
      console.error("❌ Error details:", JSON.stringify(updateError));
      
      // The refund was processed but the database update failed
      // We still want to return success but with a warning
      return new Response(
        JSON.stringify({
          success: true,
          warning: `Refund was processed successfully (ID: ${stripeRefund.id}), but database update failed: ${updateError.message}`,
          refundId: stripeRefund.id,
          status: newStatus
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        }
      );
    }
    
    // Get clinic data for notifications
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', payment.clinic_id)
      .single();
      
    if (clinicError) {
      console.error("❌ Error fetching clinic data:", clinicError);
      console.error("Continuing without clinic data");
    }
    
    // Queue refund notification if we have patient contact information
    try {
      // Only send notification if we have contact information
      if (payment.patient_email || payment.patient_phone) {
        // Create standardized notification payload matching payment_success structure
        const refundPayload = {
          notification_type: "payment_refund",
          notification_method: {
            email: !!payment.patient_email,
            sms: !!payment.patient_phone
          },
          patient: {
            name: payment.patient_name || 'Patient',
            email: payment.patient_email,
            phone: payment.patient_phone
          },
          payment: {
            reference: payment.payment_ref,
            amount: payment.amount_paid,
            refund_amount: refundAmountToStore,
            payment_link: `https://clinipay.co.uk/payment-receipt/${paymentId}`,
            message: isFullRefund ? "Your payment has been fully refunded" : "Your payment has been partially refunded",
            is_full_refund: isFullRefund
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your healthcare provider',
            email: clinicData?.email,
            phone: clinicData?.phone
          }
        };
        
        // Add to notification queue
        const { error: notifyError } = await supabase
          .from("notification_queue")
          .insert({
            type: 'payment_refund',
            payload: refundPayload,
            payment_id: paymentId,
            recipient_type: 'patient'
          });
          
        if (notifyError) {
          console.error(`❌ Error queueing refund notification: ${notifyError.message}`);
          console.error("Error details:", JSON.stringify(notifyError));
        } else {
          console.log(`✅ Successfully queued refund notification for patient`);
        }
        
        // Create clinic notification with the same standardized structure
        // but including financial details
        const clinicPayload = {
          notification_type: "payment_refund",
          notification_method: {
            email: clinicData?.email_notifications ?? true,
            sms: clinicData?.sms_notifications ?? true
          },
          patient: {
            name: payment.patient_name || 'Patient',
            email: payment.patient_email,
            phone: payment.patient_phone
          },
          payment: {
            reference: payment.payment_ref,
            amount: payment.amount_paid,
            refund_amount: refundAmountToStore,
            payment_link: `https://clinipay.co.uk/payment-receipt/${paymentId}`,
            message: isFullRefund ? "Full payment refund processed" : "Partial payment refund processed",
            is_full_refund: isFullRefund,
            financial_details: {
              gross_amount: payment.amount_paid,
              stripe_fee: payment.stripe_fee ? payment.stripe_fee / 100 : 0, // Convert from cents to pounds
              platform_fee: payment.platform_fee ? payment.platform_fee / 100 : 0, // Convert from cents to pounds
              net_amount: payment.net_amount ? payment.net_amount / 100 : 0, // Convert from cents to pounds
              refund_fee: refundFeeInCents / 100 // Convert from cents to pounds
            }
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your clinic',
            email: clinicData?.email,
            phone: clinicData?.phone
          }
        };
        
        // Queue notification for clinic
        const { error: clinicNotifyError } = await supabase
          .from("notification_queue")
          .insert({
            type: 'payment_refund',
            payload: clinicPayload,
            payment_id: paymentId,
            recipient_type: 'clinic'
          });
          
        if (clinicNotifyError) {
          console.error(`❌ Error queueing clinic refund notification: ${clinicNotifyError.message}`);
          console.error("Error details:", JSON.stringify(clinicNotifyError));
        } else {
          console.log(`✅ Successfully queued refund notification for clinic`);
        }
      } else {
        console.log("⚠️ No patient contact information available for refund notification");
      }
    } catch (notifyErr) {
      console.error(`❌ Error in refund notification processing: ${notifyErr.message}`);
      // Don't rethrow, just log the error - this shouldn't affect the main refund processing
    }

    console.log(`✅ Refund process completed successfully`);
    return new Response(
      JSON.stringify({
        success: true,
        refundId: stripeRefund.id,
        status: newStatus,
        refundFee: refundFeeInCents // Return refund fee in response for information
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (err) {
    console.error("❌ Refund processing error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "An unexpected error occurred",
        errorDetails: err.toString(),
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
