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
    console.log('Creating payment record for installment payment');
    
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
    
    console.log('Payment record created:', payment?.id);
    
    // Retrieve payment schedule details to get payment_request_id if available
    const { data: scheduleData, error: scheduleGetError } = await supabase
      .from('payment_schedule')
      .select('payment_request_id')
      .eq('id', paymentScheduleId)
      .single();
      
    if (scheduleGetError) {
      console.error('Error getting payment schedule data:', scheduleGetError);
      // Continue processing - this is non-critical
    }
    
    // Update payment request status if it exists
    if (scheduleData?.payment_request_id) {
      console.log(`Found payment request ID: ${scheduleData.payment_request_id}, updating status`);
      
      const { error: requestUpdateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_id: payment?.id
        })
        .eq('id', scheduleData.payment_request_id);
        
      if (requestUpdateError) {
        console.error('Error updating payment request:', requestUpdateError);
        // Non-critical error, continue
      } else {
        console.log(`Updated payment request ${scheduleData.payment_request_id} status to 'paid'`);
      }
    }
    
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
    
    // MODIFIED: Count actual paid installments from payment_schedule table
    // and INCLUDE refunded and partially refunded statuses as paid
    const { count: paidInstallments, error: countError } = await supabase
      .from('payment_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId)
      .in('status', ['paid', 'refunded', 'partially_refunded']);
      
    if (countError) {
      console.error('Error counting paid installments:', countError);
      throw countError;
    }

    // Get plan details to calculate progress correctly
    const { data: planData, error: planFetchError } = await supabase
      .from('plans')
      .select('total_installments')
      .eq('id', planId)
      .single();
      
    if (planFetchError) {
      console.error('Error fetching plan details:', planFetchError);
      throw planFetchError;
    }
    
    // Calculate new values
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
          paymentId: payment?.id,
          paymentReference: paymentReference,  // MODIFIED: Added payment reference
          installmentNumber: paidInstallments,
          totalInstallments: planData.total_installments,
          progress: progress
        }
      });
    
    console.log(`Installment payment processing complete for payment schedule ${paymentScheduleId}`);
    
    // Queue notification for payment success
    try {
      console.log('Queueing payment success notification');
      
      // Get clinic data
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
        
      if (clinicError) {
        console.error("Error fetching clinic data:", clinicError);
        console.error("Continuing without clinic data");
      }
      
      // Queue notifications for payment success
      const patientPayload = {
        notification_type: "payment_success",
        notification_method: {
          email: !!patientEmail,
          sms: !!patientPhone
        },
        patient: {
          name: patientName || 'Patient',
          email: patientEmail,
          phone: patientPhone
        },
        payment: {
          reference: paymentReference,
          amount: amount,
          refund_amount: null,
          payment_link: payment?.id ? `https://clinipay.co.uk/payment-receipt/${payment.id}` : null,
          message: "Your payment was successful"
        },
        clinic: {
          id: clinicId,
          name: clinicData?.clinic_name || 'Your healthcare provider',
          email: clinicData?.email,
          phone: clinicData?.phone
        }
      };
      
      const { error: notifyError } = await supabase
        .from("notification_queue")
        .insert({
          type: 'payment_success',
          payload: patientPayload,
          payment_id: payment?.id,
          recipient_type: 'patient'
        });
        
      if (notifyError) {
        console.error(`Error queueing patient notification: ${notifyError.message}`);
      } else {
        console.log(`Successfully queued payment success notification for patient`);
      }
      
      // Queue clinic notification
      const clinicPayload = {
        notification_type: "payment_success",
        notification_method: {
          email: clinicData?.email_notifications ?? true,
          sms: clinicData?.sms_notifications ?? false
        },
        patient: {
          name: patientName || 'Anonymous',
          email: patientEmail,
          phone: patientPhone
        },
        payment: {
          reference: paymentReference,
          amount: amount,
          refund_amount: null,
          payment_link: payment?.id ? `https://clinipay.co.uk/payment-receipt/${payment.id}` : null,
          message: "Payment received successfully"
        },
        clinic: {
          id: clinicId,
          name: clinicData?.clinic_name || 'Your clinic',
          email: clinicData?.email,
          phone: clinicData?.phone
        }
      };
      
      const { error: clinicNotifyError } = await supabase
        .from("notification_queue")
        .insert({
          type: 'payment_success',
          payload: clinicPayload,
          payment_id: payment?.id,
          recipient_type: 'clinic'
        });
        
      if (clinicNotifyError) {
        console.error(`Error queueing clinic notification: ${clinicNotifyError.message}`);
      } else {
        console.log(`Successfully queued payment notification for clinic`);
      }
      
    } catch (notifyErr) {
      console.error(`Error in notification processing: ${notifyErr.message}`);
      // Don't throw, just log the error
    }
    
    return {
      success: true,
      paymentId: payment?.id,
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
    
    // If this payment was for a payment request, update it
    if (requestId) {
      console.log(`Updating payment request: ${requestId}`);
      
      const { error: requestUpdateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_id: payment.id
        })
        .eq('id', requestId);
        
      if (requestUpdateError) {
        console.error('Error updating payment request:', requestUpdateError);
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
          paymentReference: paymentReference  // MODIFIED: Added payment reference
        }
      });
    
    // Queue notification
    try {
      console.log('Queueing payment notifications');
      
      // Get clinic data
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
        
      if (clinicError) {
        console.error("Error fetching clinic data:", clinicError);
        console.error("Continuing without clinic data");
      }
      
      // Queue patient notification
      if (patientEmail || patientPhone) {
        const patientPayload = {
          notification_type: "payment_success",
          notification_method: {
            email: !!patientEmail,
            sms: !!patientPhone
          },
          patient: {
            name: patientName || 'Patient',
            email: patientEmail,
            phone: patientPhone
          },
          payment: {
            reference: paymentReference,
            amount: amount,
            refund_amount: null,
            payment_link: `https://clinipay.co.uk/payment-receipt/${payment.id}`,
            message: "Your payment was successful"
          },
          clinic: {
            id: clinicId,
            name: clinicData?.clinic_name || 'Your healthcare provider',
            email: clinicData?.email,
            phone: clinicData?.phone
          }
        };
        
        const { error: notifyError } = await supabase
          .from("notification_queue")
          .insert({
            type: 'payment_success',
            payload: patientPayload,
            payment_id: payment.id,
            recipient_type: 'patient'
          });
          
        if (notifyError) {
          console.error(`Error queueing patient notification: ${notifyError.message}`);
        } else {
          console.log(`Successfully queued payment success notification for patient`);
        }
      }
      
      // Queue clinic notification
      const clinicPayload = {
        notification_type: "payment_success",
        notification_method: {
          email: clinicData?.email_notifications ?? true,
          sms: clinicData?.sms_notifications ?? false
        },
        patient: {
          name: patientName || 'Anonymous',
          email: patientEmail,
          phone: patientPhone
        },
        payment: {
          reference: paymentReference,
          amount: amount,
          refund_amount: null,
          payment_link: `https://clinipay.co.uk/payment-receipt/${payment.id}`,
          message: "Payment received successfully",
          financial_details: {
            gross_amount: amount,
            stripe_fee: paymentIntent.application_fee_amount || 0,
            platform_fee: platformFeeAmount,
            net_amount: netAmount
          }
        },
        clinic: {
          id: clinicId,
          name: clinicData?.clinic_name || 'Your clinic',
          email: clinicData?.email,
          phone: clinicData?.phone
        }
      };
      
      const { error: clinicNotifyError } = await supabase
        .from("notification_queue")
        .insert({
          type: 'payment_success',
          payload: clinicPayload,
          payment_id: payment.id,
          recipient_type: 'clinic'
        });
        
      if (clinicNotifyError) {
        console.error(`Error queueing clinic notification: ${clinicNotifyError.message}`);
      } else {
        console.log(`Successfully queued payment notification for clinic`);
      }
      
    } catch (notifyErr) {
      console.error(`Error in notification processing: ${notifyErr.message}`);
      // Don't throw, just log the error
    }
    
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
