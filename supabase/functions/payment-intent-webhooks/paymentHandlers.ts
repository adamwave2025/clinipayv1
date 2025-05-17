
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateUUID } from './utils.ts';

export async function handlePaymentIntentSucceeded(paymentIntent: any, supabase: SupabaseClient) {
  console.log(`Processing successful payment: ${paymentIntent.id}`);
  
  try {
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    console.log('Payment intent metadata:', JSON.stringify(metadata, null, 2));
    
    // Check if this payment is for a payment schedule (installment payment)
    const paymentScheduleId = metadata.payment_schedule_id;
    const planId = metadata.planId;
    
    // Handle payment schedule payment (installment payment)
    if (paymentScheduleId && planId) {
      console.log(`Payment is for payment schedule ID: ${paymentScheduleId}, plan ID: ${planId}`);
      return await handleInstallmentPayment(paymentIntent, supabase, paymentScheduleId, planId);
    }
    
    // Normal payment processing (non-installment)
    return await handleStandardPayment(paymentIntent, supabase);
  } catch (error) {
    console.error(`Error processing payment intent ${paymentIntent.id}:`, error);
    throw error;
  }
}

async function handleInstallmentPayment(paymentIntent: any, supabase: SupabaseClient, paymentScheduleId: string, planId: string) {
  console.log(`Processing installment payment for schedule ID: ${paymentScheduleId}`);
  
  // Extract metadata
  const metadata = paymentIntent.metadata || {};
  const clinicId = metadata.clinicId;
  const patientName = metadata.patientName;
  const patientEmail = metadata.patientEmail;
  const patientPhone = metadata.patientPhone || null;
  const paymentLinkId = metadata.paymentLinkId || null;
  const platformFeePercent = metadata.platformFeePercent || '3';
  const paymentReference = metadata.paymentReference || `CLN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Calculate fees
  const amount = paymentIntent.amount;
  const platformFeeAmount = Math.round((parseFloat(platformFeePercent) / 100) * amount);
  const netAmount = amount - (paymentIntent.application_fee_amount || 0) - platformFeeAmount;
  
  try {
    // Begin transaction
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        clinic_id: clinicId,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        amount_paid: amount,
        paid_at: new Date().toISOString(),
        payment_link_id: paymentLinkId,
        payment_ref: paymentReference,
        stripe_payment_id: paymentIntent.id,
        status: 'paid',
        net_amount: netAmount,
        platform_fee: platformFeeAmount,
        stripe_fee: paymentIntent.application_fee_amount || 0,
        payment_schedule_id: paymentScheduleId
      })
      .select()
      .single();
      
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw paymentError;
    }
    
    console.log('Payment record created:', payment.id);
    
    // Update payment schedule status to 'paid'
    const { error: scheduleError } = await supabase
      .from('payment_schedule')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentScheduleId);
      
    if (scheduleError) {
      console.error('Error updating payment schedule:', scheduleError);
      throw scheduleError;
    }
    
    console.log(`Updated payment schedule ${paymentScheduleId} status to 'paid'`);
    
    // Update plan details - increment paid_installments and progress
    const { data: planData, error: planFetchError } = await supabase
      .from('plans')
      .select('paid_installments, total_installments')
      .eq('id', planId)
      .single();
      
    if (planFetchError) {
      console.error('Error fetching plan details:', planFetchError);
      throw planFetchError;
    }
    
    // Calculate new values
    const paidInstallments = (planData.paid_installments || 0) + 1;
    const progress = Math.round((paidInstallments / planData.total_installments) * 100);
    
    // Determine if all installments are paid
    const isCompleted = paidInstallments >= planData.total_installments;
    
    // Update plan
    const { error: planUpdateError } = await supabase
      .from('plans')
      .update({
        paid_installments: paidInstallments,
        progress: progress,
        status: isCompleted ? 'completed' : 'active',
        updated_at: new Date().toISOString(),
        // Update next due date to the next unpaid installment
        next_due_date: isCompleted ? null : undefined
      })
      .eq('id', planId);
      
    if (planUpdateError) {
      console.error('Error updating plan details:', planUpdateError);
      throw planUpdateError;
    }
    
    // If not all installments are paid, update the next_due_date to the next unpaid installment
    if (!isCompleted) {
      // Find the next unpaid installment
      const { data: nextPayment, error: nextPaymentError } = await supabase
        .from('payment_schedule')
        .select('due_date')
        .eq('plan_id', planId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(1)
        .single();
        
      if (nextPayment && !nextPaymentError) {
        // Update plan's next due date
        await supabase
          .from('plans')
          .update({
            next_due_date: nextPayment.due_date
          })
          .eq('id', planId);
          
        console.log(`Updated plan ${planId} next due date to ${nextPayment.due_date}`);
      }
    }
    
    // Record payment activity
    await supabase
      .from('payment_activity')
      .insert({
        payment_link_id: paymentLinkId,
        patient_id: null, // We'll update this if patient exists
        clinic_id: clinicId,
        action_type: 'installment_payment_received',
        plan_id: planId,
        details: {
          amount: amount,
          paymentId: payment.id,
          paymentReference,
          installmentNumber: paidInstallments,
          totalInstallments: planData.total_installments,
          progress: progress
        }
      });
    
    console.log(`Installment payment processing complete for payment schedule ${paymentScheduleId}`);
    
    return {
      success: true,
      paymentId: payment.id,
      message: `Payment recorded successfully for installment`
    };
  } catch (error) {
    console.error('Error processing installment payment:', error);
    throw error;
  }
}

async function handleStandardPayment(paymentIntent: any, supabase: SupabaseClient) {
  // Extract metadata
  const metadata = paymentIntent.metadata || {};
  const clinicId = metadata.clinicId;
  const patientName = metadata.patientName;
  const patientEmail = metadata.patientEmail;
  const patientPhone = metadata.patientPhone || null;
  const paymentLinkId = metadata.paymentLinkId || null;
  const requestId = metadata.requestId || null;
  const platformFeePercent = metadata.platformFeePercent || '3';
  const paymentReference = metadata.paymentReference || `CLN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Calculate fees
  const amount = paymentIntent.amount;
  const platformFeeAmount = Math.round((parseFloat(platformFeePercent) / 100) * amount);
  const netAmount = amount - (paymentIntent.application_fee_amount || 0) - platformFeeAmount;
  
  try {
    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        clinic_id: clinicId,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        amount_paid: amount,
        paid_at: new Date().toISOString(),
        payment_link_id: paymentLinkId,
        payment_ref: paymentReference,
        stripe_payment_id: paymentIntent.id,
        status: 'paid',
        net_amount: netAmount,
        platform_fee: platformFeeAmount,
        stripe_fee: paymentIntent.application_fee_amount || 0
      })
      .select()
      .single();
      
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw paymentError;
    }
    
    console.log('Payment record created:', payment.id);
    
    // If this was a payment request, update it
    if (requestId) {
      const { error: requestError } = await supabase
        .from('payment_requests')
        .update({
          status: 'paid',
          payment_id: payment.id,
          paid_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (requestError) {
        console.error('Error updating payment request:', requestError);
        // Non-critical error, continue
      } else {
        console.log(`Updated payment request ${requestId} status to 'paid'`);
      }
    }
    
    // Record payment activity
    await supabase
      .from('payment_activity')
      .insert({
        payment_link_id: paymentLinkId,
        patient_id: null, // We'll update this if patient exists
        clinic_id: clinicId,
        action_type: 'payment_received',
        details: {
          amount: amount,
          paymentId: payment.id,
          paymentReference
        }
      });
    
    // Queue notification
    await supabase
      .from('notification_queue')
      .insert({
        type: 'payment_received',
        recipient_type: 'clinic',
        payload: {
          payment_id: payment.id,
          clinic_id: clinicId,
          amount: amount,
          patient_name: patientName
        }
      });
    
    return {
      success: true,
      paymentId: payment.id,
      message: 'Payment recorded successfully'
    };
  } catch (error) {
    console.error('Error processing standard payment:', error);
    throw error;
  }
}

export async function handlePaymentIntentFailed(paymentIntent: any, supabase: SupabaseClient) {
  console.log(`Processing failed payment: ${paymentIntent.id}`);
  
  try {
    // Extract metadata
    const metadata = paymentIntent.metadata || {};
    const clinicId = metadata.clinicId;
    const patientName = metadata.patientName || 'Unknown';
    const paymentLinkId = metadata.paymentLinkId || null;
    const requestId = metadata.requestId || null;
    const paymentScheduleId = metadata.payment_schedule_id;
    const planId = metadata.planId;
    
    // Log the payment failure
    console.log(`Payment failed for clinic ${clinicId}, patient: ${patientName}`);
    console.log('Failure reason:', paymentIntent.last_payment_error?.message || 'Unknown');
    
    // Record failed payment in activity
    await supabase
      .from('payment_activity')
      .insert({
        payment_link_id: paymentLinkId,
        patient_id: null,
        clinic_id: clinicId,
        action_type: 'payment_failed',
        plan_id: planId || null,
        details: {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          failureMessage: paymentIntent.last_payment_error?.message || 'Unknown error',
          paymentScheduleId: paymentScheduleId || null
        }
      });
    
    // If this was a payment request, update its status
    if (requestId) {
      await supabase
        .from('payment_requests')
        .update({
          status: 'failed'
        })
        .eq('id', requestId);
      
      console.log(`Updated payment request ${requestId} status to 'failed'`);
    }
    
    // If this was an installment payment, we might want to handle it specifically
    if (paymentScheduleId && planId) {
      console.log(`Failed payment was for installment: ${paymentScheduleId}, plan: ${planId}`);
      // We don't change the status of the payment_schedule, it remains 'pending'
      // This allows the user to retry the payment
    }
    
    return {
      success: false,
      message: 'Payment failure recorded'
    };
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}
