
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatMonetaryValue(amountInPence) {
  if (amountInPence === null || amountInPence === undefined) {
    return "0.00";
  }
  return (amountInPence / 100).toFixed(2);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { paymentId, refundAmount, fullRefund = false } = await req.json();
    
    // Validate input
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }
    
    console.log(`Processing refund request: paymentId=${paymentId}, refundAmount=${refundAmount}, fullRefund=${fullRefund}`);
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get the payment details
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        id,
        amount_paid,
        stripe_payment_id,
        refund_amount,
        status,
        clinic_id,
        patient_id,
        patient_name,
        patient_email,
        patient_phone,
        payment_ref,
        manual_payment,
        clinics:clinic_id (
          id,
          clinic_name,
          stripe_account_id,
          stripe_status
        )
      `)
      .eq('id', paymentId)
      .single();
    
    if (paymentError || !paymentData) {
      throw new Error(`Payment not found: ${paymentError?.message || 'No data returned'}`);
    }
    
    // Check if already fully refunded
    if (paymentData.status === 'refunded') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment has already been fully refunded'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get('SECRET_KEY') || '', {
      apiVersion: '2023-10-16'
    });
    
    let refundedAmount;
    let stripeRefundId;
    let refundFee = 0;
    
    // CRITICAL FIX: Handle refund amount consistently
    // If refundAmount is provided in pounds (as a decimal), convert to pence for stripe
    // If not provided, use the full payment amount
    let refundAmountInPence;
    
    if (fullRefund) {
      // Full refund
      refundAmountInPence = paymentData.amount_paid;
      console.log(`Processing full refund of ${refundAmountInPence}p`);
    } else if (refundAmount) {
      // Check if refundAmount is in pounds (decimal) or pence (integer)
      if (refundAmount < 10 && String(refundAmount).includes('.')) {
        // Convert pounds to pence for Stripe
        refundAmountInPence = Math.round(refundAmount * 100);
        console.log(`Converted refund amount from pounds (£${refundAmount}) to pence (${refundAmountInPence}p)`);
      } else {
        // Already in pence
        refundAmountInPence = Math.round(refundAmount);
        console.log(`Using refund amount as pence: ${refundAmountInPence}p`);
      }
    } else {
      throw new Error('Either refundAmount or fullRefund must be specified');
    }
    
    // For manual payments, just update the database without calling Stripe
    if (paymentData.manual_payment === true) {
      console.log(`Processing manual payment refund of ${refundAmountInPence}p`);
      
      // Update payment status in the database
      const isFullRefund = refundAmountInPence >= paymentData.amount_paid;
      const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';
      
      // Amount to store in the database (always in pence/cents)
      const refundAmountToStore = refundAmountInPence;
      
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({
          status: newStatus,
          refund_amount: refundAmountToStore,
          refunded_at: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (updateError) {
        throw new Error(`Failed to update payment status: ${updateError.message}`);
      }
      
      refundedAmount = refundAmountInPence;
      
      console.log(`Manual payment marked as ${newStatus} with refund amount ${refundedAmount}p`);
    } else {
      // For regular Stripe payments, process through Stripe
      if (!paymentData.stripe_payment_id) {
        throw new Error('Payment has no associated Stripe payment ID');
      }
      
      // Get the connected account ID if this is a connected account payment
      const stripeAccount = paymentData.clinics?.stripe_account_id;
      
      let stripeOptions = {};
      if (stripeAccount) {
        stripeOptions = { stripeAccount };
      }
      
      try {
        // Create the refund in Stripe
        console.log(`Creating Stripe refund for payment ${paymentData.stripe_payment_id} with amount ${refundAmountInPence}p`);
        const refund = await stripe.refunds.create({
          payment_intent: paymentData.stripe_payment_id,
          amount: refundAmountInPence
        }, stripeOptions);
        
        console.log(`Stripe refund created: ${refund.id}`);
        stripeRefundId = refund.id;
        
        // Calculate the refund fee (usually 0 for refunds but can vary)
        if (refund.fee) {
          refundFee = Math.abs(refund.fee);
          console.log(`Refund fee: ${refundFee}p`);
        }
        
        refundedAmount = refundAmountInPence;
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        throw new Error(`Stripe refund failed: ${stripeError.message}`);
      }
      
      // Update payment status in database
      const isFullRefund = refundAmountInPence >= paymentData.amount_paid;
      const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';
      
      // Amount to store in database (always in pence/cents)
      const refundAmountToStore = refundAmountInPence;
      
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({
          status: newStatus,
          refund_amount: refundAmountToStore,
          refunded_at: new Date().toISOString(),
          stripe_refund_id: stripeRefundId,
          stripe_refund_fee: refundFee
        })
        .eq('id', paymentId);
      
      if (updateError) {
        throw new Error(`Failed to update payment status: ${updateError.message}`);
      }
      
      console.log(`Payment ${paymentId} updated with status ${newStatus} and refund amount ${refundAmountToStore}p`);
    }
    
    // Queue refund notifications
    try {
      // Format for display
      const refundAmountFormatted = formatMonetaryValue(refundAmountInPence);
      
      console.log(`Queueing refund notification with formatted amount: £${refundAmountFormatted}`);
      
      // Create notification payload (refund amount stored in pence but will be formatted in the queue processor)
      const notificationPayload = {
        notification_type: 'refund',
        notification_method: {
          email: true,
          sms: paymentData.patient_phone ? true : false
        },
        patient: {
          name: paymentData.patient_name || 'Patient',
          email: paymentData.patient_email,
          phone: paymentData.patient_phone
        },
        payment: {
          reference: paymentData.payment_ref || paymentData.id,
          amount: paymentData.amount_paid, // In pence
          refund_amount: refundAmountInPence, // In pence
          payment_link: `https://clinipay.co.uk/payment-receipt/${paymentData.id}`,
          message: `Your payment has been refunded (£${refundAmountFormatted})`
        },
        clinic: {
          id: paymentData.clinic_id,
          name: paymentData.clinics?.clinic_name || 'Your healthcare provider'
        }
      };
      
      // Queue notification for patient
      if (paymentData.patient_email || paymentData.patient_phone) {
        const { error: notifyError } = await supabaseClient
          .from('notification_queue')
          .insert({
            type: 'payment_refund',
            recipient_type: 'patient',
            payment_id: paymentId,
            status: 'pending',
            payload: notificationPayload
          });
        
        if (notifyError) {
          console.error('Failed to queue patient refund notification:', notifyError);
        }
      }
      
      // Queue notification for clinic
      const { error: notifyClinicError } = await supabaseClient
        .from('notification_queue')
        .insert({
          type: 'payment_refund',
          recipient_type: 'clinic',
          payment_id: paymentId,
          status: 'pending',
          payload: notificationPayload
        });
      
      if (notifyClinicError) {
        console.error('Failed to queue clinic refund notification:', notifyClinicError);
      }
      
      // Check if this payment is part of a payment plan
      const { data: scheduleData, error: scheduleError } = await supabaseClient
        .from('payment_schedule')
        .select('plan_id')
        .eq('payment_id', paymentId)
        .maybeSingle();
      
      if (scheduleData?.plan_id) {
        console.log(`This payment is part of plan ${scheduleData.plan_id}, updating plan status...`);
        
        // Update plan progress
        const { data: planData, error: planError } = await supabaseClient
          .rpc('update_plan_progress', {
            p_plan_id: scheduleData.plan_id
          });
        
        if (planError) {
          console.error('Failed to update plan progress:', planError);
        } else {
          console.log('Plan progress updated:', planData);
        }
      }
    } catch (notificationError) {
      console.error('Error queueing notifications:', notificationError);
      // Don't throw here, as the refund itself was successful
    }

    // Trigger the notification processing
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-notification-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        }
      });
    } catch (triggerError) {
      console.error('Error triggering notification queue:', triggerError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      status: refundedAmount >= paymentData.amount_paid ? 'refunded' : 'partially_refunded',
      refundAmount: Number(formatMonetaryValue(refundedAmount)), // Convert to pounds for response
      refundFee: refundFee ? Number(formatMonetaryValue(refundFee)) : 0 // Convert to pounds for response
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
