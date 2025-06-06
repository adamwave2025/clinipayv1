
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

/**
 * Format a monetary value from pence/cents to pounds/dollars with 2 decimal places
 * This ensures consistency in all notification payloads
 */
function formatMonetaryValue(amountInPence) {
  if (amountInPence === null || amountInPence === undefined) return "0.00";
  
  // Convert from pence to pounds and ensure 2 decimal places
  return (amountInPence / 100).toFixed(2);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log("🔄 Refund process started");
    
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

    const stripeSecretKey = Deno.env.get("SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("❌ Missing Stripe secret key in environment variables");
      throw new Error("Payment processing is not configured properly. Please contact support.");
    }

    // Log the raw refund amount received (should be in pounds)
    console.log(`🧾 Processing refund for payment ${paymentId}, raw amount: ${refundAmount}, fullRefund: ${fullRefund}`);

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16"
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase credentials in environment variables");
      throw new Error("Database connection not configured. Please contact support.");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    if (!payment.stripe_payment_id) {
      console.error("❌ Missing Stripe payment ID in payment record");
      throw new Error("This payment does not have a Stripe payment ID.");
    }

    const stripePaymentId = payment.stripe_payment_id;

    let stripeRefund;
    let refundFeeInCents = 0;
    let balanceTransaction = null;

    try {
      console.log(`💳 Creating Stripe refund for payment intent: ${stripePaymentId}`);
      
      // Convert amount from pounds to pence for Stripe (Stripe expects amounts in pennies)
      const refundAmountInPence = fullRefund ? undefined : Math.round(refundAmount * 100);
      console.log(`💰 Refund amount in pence for Stripe: ${refundAmountInPence || 'full refund'}`);
      
      stripeRefund = await stripe.refunds.create({
        payment_intent: stripePaymentId,
        amount: refundAmountInPence, // Will be undefined for full refund
        refund_application_fee: true,
        reverse_transfer: true
      });
      
      console.log(`✅ Stripe refund created with ID: ${stripeRefund.id}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (stripeRefund.balance_transaction) {
        try {
          const transactionId = typeof stripeRefund.balance_transaction === 'string' 
            ? stripeRefund.balance_transaction 
            : stripeRefund.balance_transaction.id;
            
          console.log(`🔍 Retrieving balance transaction with ID: ${transactionId}`);
          
          balanceTransaction = await stripe.balanceTransactions.retrieve(transactionId);
          
          console.log('📊 Balance transaction details:', JSON.stringify(balanceTransaction, null, 2));
          
          if (balanceTransaction.fee !== undefined) {
            refundFeeInCents = balanceTransaction.fee;
            console.log(`💰 Stripe refund fee found: ${refundFeeInCents} cents (${refundFeeInCents / 100} GBP)`);
            
            if (balanceTransaction.fee_details) {
              console.log('📝 Fee breakdown:', JSON.stringify(balanceTransaction.fee_details, null, 2));
            }
          } else {
            console.log(`⚠️ No fee found in balance transaction. Full transaction:`, JSON.stringify(balanceTransaction, null, 2));
          }
        } catch (feeError) {
          console.error(`❌ Error retrieving refund fee:`, feeError);
          console.error(`🔍 Error details:`, JSON.stringify(feeError, null, 2));
          
          EdgeRuntime.waitUntil((async () => {
            try {
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              console.log(`🔄 Retrying balance transaction retrieval...`);
              const retryTransaction = await stripe.balanceTransactions.retrieve(
                typeof stripeRefund.balance_transaction === 'string'
                  ? stripeRefund.balance_transaction
                  : stripeRefund.balance_transaction.id
              );
              
              if (retryTransaction.fee !== undefined) {
                console.log(`✅ Successfully retrieved fee on retry: ${retryTransaction.fee} cents`);
                
                const { error: updateError } = await supabase
                  .from('payments')
                  .update({ stripe_refund_fee: retryTransaction.fee })
                  .eq('id', paymentId);
                  
                if (updateError) {
                  console.error('❌ Error updating payment with retry fee:', updateError);
                } else {
                  console.log('✅ Successfully updated payment with retry fee');
                }
              }
            } catch (retryError) {
              console.error('❌ Error in background fee retry:', retryError);
            }
          })());
        }
      } else {
        console.log(`⚠️ No balance transaction ID found in refund response. Full refund:`, JSON.stringify(stripeRefund, null, 2));
      }
    } catch (stripeError) {
      console.error("❌ Stripe refund error:", stripeError);
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

    const epsilon = 0.001;
    let isFullRefund = fullRefund;
    
    if (!isFullRefund && refundAmount) {
      // Get payment amount in pounds by dividing the stored amount_paid by 100
      const paymentAmountPounds = payment.amount_paid / 100;
      
      // Compare refund amount (in pounds) with payment amount (in pounds)
      isFullRefund = Math.abs(paymentAmountPounds - refundAmount) < epsilon;
      
      console.log(`🧮 Full refund calculation: Payment amount=£${paymentAmountPounds}, Refund amount=£${refundAmount}, Difference=${Math.abs(paymentAmountPounds - refundAmount)}, isFullRefund=${isFullRefund}`);
    }

    const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';
    const refundAmountToStore = isFullRefund ? payment.amount_paid : Math.round(refundAmount * 100);
    const currentTimestamp = new Date().toISOString();
    
    console.log(`💾 Updating payment record to status: ${newStatus} (isFullRefund: ${isFullRefund})`);
    console.log(`💰 Storing refund amount in pence: ${refundAmountToStore} (${refundAmountToStore/100} GBP)`);
    
    const updateData = {
      status: newStatus,
      refund_amount: refundAmountToStore,
      refunded_at: currentTimestamp,
      stripe_refund_id: stripeRefund.id,
      stripe_refund_fee: refundFeeInCents
    };

    console.log(`📦 Update data: ${JSON.stringify(updateData)}`);
    
    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    if (updateError) {
      console.error("❌ Error updating payment record:", updateError);
      console.error("❌ Error details:", JSON.stringify(updateError));
      
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

    // Multi-path update for payment plan, schedule, and activity tracking
    try {
      console.log('🔄 Starting multi-path update for related plan data');
      let planId = null;
      let scheduleItem = null;
      let updatePath = 'none';
      
      // Path 1: Direct payment_schedule_id link in the payment
      if (payment.payment_schedule_id) {
        console.log(`📋 Path 1: Payment has direct payment_schedule_id: ${payment.payment_schedule_id}`);
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('payment_schedule')
          .select('*')
          .eq('id', payment.payment_schedule_id)
          .single();
          
        if (scheduleError) {
          console.error('❌ Path 1 Error: Error fetching payment schedule:', scheduleError);
        } else if (scheduleData) {
          console.log('✅ Path 1 Success: Found payment schedule item via direct link:', scheduleData.id);
          scheduleItem = scheduleData;
          planId = scheduleData.plan_id;
          updatePath = 'direct_link';
        }
      }
      
      // Path 2: Payment linked through payment_request (existing path)
      if (!scheduleItem) {
        console.log('🔍 Path 2: Checking payment_requests link');
        const { data: paymentRequest, error: requestError } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('payment_id', paymentId)
          .maybeSingle();
          
        if (requestError) {
          console.error('❌ Path 2 Error: Error checking payment request:', requestError);
        } else if (paymentRequest) {
          console.log('📋 Path 2: Found payment request:', paymentRequest.id);
          
          const { data: scheduleData, error: scheduleError } = await supabase
            .from('payment_schedule')
            .select('*')
            .eq('payment_request_id', paymentRequest.id)
            .maybeSingle();
            
          if (scheduleError) {
            console.error('❌ Path 2 Error: Error checking payment schedule:', scheduleError);
          } else if (scheduleData) {
            console.log('✅ Path 2 Success: Found payment schedule item via payment request:', scheduleData.id);
            scheduleItem = scheduleData;
            planId = scheduleData.plan_id;
            updatePath = 'payment_request';
          }
        }
      }
      
      // Path 3: Try to find by matching payment_link_id and patient_id if both are available
      if (!scheduleItem && payment.payment_link_id && payment.patient_id) {
        console.log('🔍 Path 3: Attempting lookup by payment_link_id and patient_id');
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('payment_schedule')
          .select('*')
          .eq('payment_link_id', payment.payment_link_id)
          .eq('patient_id', payment.patient_id)
          .order('due_date', { ascending: true })
          .limit(1)
          .maybeSingle();
          
        if (scheduleError) {
          console.error('❌ Path 3 Error: Error checking payment schedule:', scheduleError);
        } else if (scheduleData) {
          console.log('✅ Path 3 Success: Found payment schedule item via payment_link_id and patient_id:', scheduleData.id);
          scheduleItem = scheduleData;
          planId = scheduleData.plan_id;
          updatePath = 'link_patient_match';
        }
      }
      
      // Path 4: Last resort - find by plan with matching patient_id and payment_link_id
      if (!scheduleItem && payment.payment_link_id && payment.patient_id) {
        console.log('🔍 Path 4: Attempting to find plan directly via patient_id and payment_link_id');
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('id')
          .eq('payment_link_id', payment.payment_link_id)
          .eq('patient_id', payment.patient_id)
          .maybeSingle();
          
        if (planError) {
          console.error('❌ Path 4 Error: Error checking plans:', planError);
        } else if (planData) {
          console.log('📋 Path 4: Found plan directly:', planData.id);
          planId = planData.id;
          updatePath = 'direct_plan';
        }
      }
      
      console.log(`🔄 Multi-path lookup result - Plan ID: ${planId}, Update Path: ${updatePath}`);
      
      // If we found a plan or schedule item, process the updates
      if (scheduleItem) {
        // Update the payment schedule status
        const scheduleStatus = isFullRefund ? 'refunded' : 'partially_refunded';
        const { error: updateScheduleError } = await supabase
          .from('payment_schedule')
          .update({ status: scheduleStatus })
          .eq('id', scheduleItem.id);
          
        if (updateScheduleError) {
          console.error('❌ Error updating payment schedule:', updateScheduleError);
        } else {
          console.log('✅ Updated payment schedule status to:', scheduleStatus);
        }
        
        // Record the refund activity with the plan_id from the schedule item
        if (planId) {
          // Use different action type based on whether it's a full or partial refund
          const actionType = isFullRefund ? 'payment_refund' : 'partial_refund';
          
          const activityPayload = {
            patient_id: scheduleItem.patient_id,
            payment_link_id: scheduleItem.payment_link_id,
            clinic_id: scheduleItem.clinic_id,
            plan_id: planId, 
            action_type: actionType,
            details: {
              payment_number: scheduleItem.payment_number,
              total_payments: scheduleItem.total_payments,
              refundAmount: refundAmountToStore,
              is_full_refund: isFullRefund,
              isFullRefund: isFullRefund,
              payment_reference: payment.payment_ref || '',
              refund_date: currentTimestamp,
              original_amount: scheduleItem.amount / 100, // Convert cents to pounds
              update_path: updatePath
            }
          };
          
          const { error: activityError } = await supabase
            .from('payment_activity')
            .insert(activityPayload);
            
          if (activityError) {
            console.error('❌ Error recording refund activity:', activityError);
          } else {
            console.log(`✅ Recorded ${actionType} activity successfully with plan_id:`, planId);
          }
        }
      }
      
      // REMOVED: Update plan metrics for both full AND partial refunds
      // The logic that decrements paid_installments has been removed as requested
      
    } catch (planUpdateError) {
      console.error('❌ Error updating payment plan relationships:', planUpdateError);
      // Don't fail the whole refund if plan update fails
    }
    
    // Continue with notification processing as before
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', payment.clinic_id)
      .single();
      
    if (clinicError) {
      console.error("❌ Error fetching clinic data:", clinicError);
      console.error("Continuing without clinic data");
    }
    
    try {
      if (payment.patient_email || payment.patient_phone) {
        // IMPORTANT: Store raw monetary values (in pence/cents) in the notification payloads
        // Add a flag to indicate these are raw values that need processing
        // Don't format or convert values here - let the notification processor handle it
        
        console.log(`💰 Adding refund amount ${refundAmountToStore}p to notification payload (raw pence value)`);
        console.log(`💰 Adding payment amount ${payment.amount_paid}p to notification payload (raw pence value)`);
        
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
            amount: payment.amount_paid, // Raw amount in pence
            refund_amount: refundAmountToStore, // Raw amount in pence
            payment_link: `https://clinipay.co.uk/payment-receipt/${paymentId}`,
            message: isFullRefund ? "Your payment has been fully refunded" : "Your payment has been partially refunded",
            is_full_refund: isFullRefund
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your healthcare provider',
            email: clinicData?.email,
            phone: clinicData?.phone
          },
          // Add a flag indicating these are raw monetary values in pence
          monetary_values_in_pence: true
        };
        
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
        
        // Clinic notification with raw monetary values
        
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
            amount: payment.amount_paid, // Raw amount in pence
            refund_amount: refundAmountToStore, // Raw amount in pence
            payment_link: `https://clinipay.co.uk/payment-receipt/${paymentId}`,
            message: isFullRefund ? "Full payment refund processed" : "Partial payment refund processed",
            is_full_refund: isFullRefund,
            financial_details: {
              gross_amount: payment.amount_paid, // Raw amount in pence
              stripe_fee: payment.stripe_fee || 0, // Raw amount in pence
              platform_fee: payment.platform_fee || 0, // Raw amount in pence
              net_amount: payment.net_amount || 0, // Raw amount in pence
              refund_fee: refundFeeInCents // Raw amount in cents
            }
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your clinic',
            email: clinicData?.email,
            phone: clinicData?.phone
          },
          // Add a flag indicating these are raw monetary values in pence
          monetary_values_in_pence: true
        };
        
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
    }

    console.log(`✅ Refund process completed successfully`);
    return new Response(
      JSON.stringify({
        success: true,
        refundId: stripeRefund.id,
        status: newStatus,
        refundFee: refundFeeInCents
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
