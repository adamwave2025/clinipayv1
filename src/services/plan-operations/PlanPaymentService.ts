
import { supabase } from '@/integrations/supabase/client';
import { addToNotificationQueue } from '@/utils/notification-queue';

/**
 * Service for handling plan payment operations such as refunds and reminders
 */
export class PlanPaymentService {
  /**
   * Record a refund for a payment
   * @param paymentId The payment ID to refund
   * @param amount The refund amount
   * @param isFullRefund Whether this is a full refund
   * @returns Object indicating success or failure
   */
  static async recordPaymentRefund(paymentId: string, amount: number, isFullRefund: boolean): Promise<{ success: boolean, error?: any }> {
    try {
      // Get the payment details
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('payment_link_id')
        .eq('id', paymentId)
        .single();
        
      if (paymentError) throw paymentError;
      
      // Find the payment schedule entry through payment requests if it exists
      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('payment_id', paymentId)
        .maybeSingle();
        
      if (requestsError) {
        console.warn('Could not fetch payment request:', requestsError);
      }
      
      let scheduleData = null;
      if (requestsData?.id) {
        // Look for associated payment schedule
        const { data: scheduleResult, error: scheduleError } = await supabase
          .from('payment_schedule')
          .select('plan_id')
          .eq('payment_request_id', requestsData.id)
          .maybeSingle();
          
        if (scheduleError) {
          console.warn('Could not find payment_schedule entry:', scheduleError);
        } else {
          scheduleData = scheduleResult;
        }
      }
      
      // Record the refund in payments table
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: isFullRefund ? 'refunded' : 'partially_refunded',
          refund_amount: amount,
          refunded_at: new Date().toISOString()
        })
        .eq('id', paymentId);
        
      if (updatePaymentError) {
        throw updatePaymentError;
      }
      
      // If this payment was part of a payment plan, update the payment_schedule status
      if (scheduleData?.plan_id && requestsData?.id) {
        const { error: updateScheduleError } = await supabase
          .from('payment_schedule')
          .update({
            status: isFullRefund ? 'refunded' : 'partially_refunded',
            updated_at: new Date().toISOString()
          })
          .eq('payment_request_id', requestsData.id);
          
        if (updateScheduleError) {
          console.warn('Could not update payment schedule status:', updateScheduleError);
        }
      }
      
      // If this is part of a payment plan, record the activity
      if (scheduleData?.plan_id) {
        await this.recordPaymentPlanActivity({
          planId: scheduleData.plan_id,
          actionType: 'payment_refunded',
          details: {
            payment_id: paymentId,
            amount: amount,
            is_full_refund: isFullRefund,
            refunded_at: new Date().toISOString()
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error recording payment refund:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Send a payment reminder for an installment
   * @param installmentId The installment ID to send a reminder for
   * @returns Object indicating success or failure
   */
  static async sendPaymentReminder(installmentId: string): Promise<{ success: boolean, error?: any }> {
    try {
      // Import and use the PaymentReminderService
      const { sendPaymentReminder } = await import('@/services/PaymentReminderService');
      const result = await sendPaymentReminder(installmentId);
      return result;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Record a manual payment for a payment plan installment
   * @param installmentId The installment ID to mark as paid
   * @returns Object indicating success or failure with the payment ID
   */
  static async recordManualPayment(installmentId: string): Promise<{ success: boolean, paymentId?: string, error?: any }> {
    try {
      console.log(`Starting recordManualPayment for installment: ${installmentId}`);
      
      // 1. Get the installment details with related info
      const { data: installment, error: fetchError } = await supabase
        .from('payment_schedule')
        .select(`
          *,
          patients:patient_id (*),
          payment_links:payment_link_id (*)
        `)
        .eq('id', installmentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching installment details:', fetchError);
        throw fetchError;
      }
      
      if (!installment) {
        return { success: false, error: 'Installment not found' };
      }
      
      console.log(`Found installment data:`, installment);
      
      // 2. Check if there's an existing payment request for this installment
      let paymentRequestId = installment.payment_request_id;
      let paymentRequest = null;
      
      if (paymentRequestId) {
        console.log(`Found existing payment_request_id: ${paymentRequestId}`);
        // Fetch the payment request details
        const { data: existingRequest, error: requestError } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('id', paymentRequestId)
          .single();
          
        if (requestError) {
          console.warn('Error fetching payment request details:', requestError);
        } else {
          paymentRequest = existingRequest;
          console.log(`Found payment request with status: ${paymentRequest.status}`);
        }
      }
      
      // 3. Generate a payment reference for the manual payment
      const paymentRef = `MAN-${Date.now().toString().substring(6)}`;
      
      // 4. Create a payment record in the payments table
      const { data: paymentData, error: insertError } = await supabase
        .from('payments')
        .insert({
          clinic_id: installment.clinic_id,
          patient_id: installment.patient_id,
          patient_name: installment.patients?.name || 'Unknown Patient',
          patient_email: installment.patients?.email,
          patient_phone: installment.patients?.phone,
          amount_paid: installment.amount,
          net_amount: installment.amount, // For manual payments, net = gross
          payment_link_id: installment.payment_link_id,
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_ref: paymentRef,
          manual_payment: true
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Error creating payment record:', insertError);
        throw insertError;
      }
      
      console.log(`Created payment record with ID: ${paymentData.id}`);
      
      // 5. Update the payment schedule with the status
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', installmentId);
      
      if (updateError) {
        console.error('Error updating payment schedule:', updateError);
        throw updateError;
      }
      
      // 6. If there's an existing payment request, also update its status and link it to the payment
      if (paymentRequestId && paymentRequest) {
        console.log(`Updating payment request ${paymentRequestId} to mark as paid`);
        const { error: updateRequestError } = await supabase
          .from('payment_requests')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_id: paymentData.id
          })
          .eq('id', paymentRequestId);
          
        if (updateRequestError) {
          console.error('Error updating payment request status:', updateRequestError);
          // Non-fatal error, continue processing
        } else {
          console.log(`Successfully updated payment request status to paid`);
        }
      }
      
      // 7. Update the plan's next_due_date field with the earliest unpaid installment date
      try {
        // Find the next unpaid installment for this plan
        const { data: nextUnpaid, error: nextError } = await supabase
          .from('payment_schedule')
          .select('due_date')
          .eq('plan_id', installment.plan_id)
          .not('status', 'in', '("paid","cancelled")') // Exclude paid and cancelled installments
          .order('due_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (nextError) {
          console.warn('Error finding next unpaid installment:', nextError);
        } else {
          // If we found a next unpaid installment, update the plan's next_due_date
          if (nextUnpaid) {
            console.log(`Found next unpaid installment with due date: ${nextUnpaid.due_date}`);
            const { error: updatePlanError } = await supabase
              .from('plans')
              .update({
                next_due_date: nextUnpaid.due_date,
                updated_at: new Date().toISOString()
              })
              .eq('id', installment.plan_id);
              
            if (updatePlanError) {
              console.warn('Error updating plan next_due_date:', updatePlanError);
            } else {
              console.log(`Updated plan next_due_date to ${nextUnpaid.due_date}`);
            }
          } else {
            console.log('No more unpaid installments found for this plan');
            // If there are no more unpaid installments, the plan might be completed
            // We could potentially update the plan status to 'completed' here
          }
        }
      } catch (nextDueError) {
        console.error('Error updating next_due_date:', nextDueError);
        // Non-fatal error, continue processing
      }
      
      // 8. Record the activity
      await this.recordPaymentPlanActivity({
        planId: installment.plan_id,
        actionType: 'manual_payment_recorded',
        details: {
          installmentId,
          paymentNumber: installment.payment_number,
          amount: installment.amount,
          paymentId: paymentData.id,
          paymentRef: paymentRef,
          updatedPaymentRequest: !!paymentRequestId
        }
      });
      
      // 9. Add to notification queue to send confirmation
      try {
        // Get clinic data for notification
        const { data: clinicData, error: clinicError } = await supabase
          .from('clinics')
          .select('clinic_name, email, phone, address_line_1, address_line_2')
          .eq('id', installment.clinic_id)
          .single();
          
        if (clinicError) {
          console.warn('Could not fetch clinic data for notification:', clinicError);
        }

        await addToNotificationQueue(
          'payment_confirmation',
          {
            notification_type: 'payment_success',
            notification_method: {
              email: !!installment.patients?.email,
              sms: !!installment.patients?.phone
            },
            patient: {
              name: installment.patients?.name || 'Unknown Patient',
              email: installment.patients?.email,
              phone: installment.patients?.phone
            },
            payment: {
              reference: paymentRef,
              amount: installment.amount / 100, // Convert to decimal currency
              message: `Manual payment for installment #${installment.payment_number}`
            },
            clinic: {
              name: clinicData?.clinic_name || 'Your Clinic',
              email: clinicData?.email,
              phone: clinicData?.phone,
              address: [clinicData?.address_line_1, clinicData?.address_line_2].filter(Boolean).join(', ')
            }
          },
          'patient',
          installment.clinic_id,
          paymentData.id
        );
        console.log(`Payment confirmation notification queued for payment ${paymentData.id}`);
      } catch (notifyError) {
        console.error('Error queuing notification (non-fatal):', notifyError);
        // Continue processing - notification error shouldn't fail the payment
      }
      
      return { success: true, paymentId: paymentData.id };
    } catch (error) {
      console.error('Error recording manual payment:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  
  /**
   * Reschedule a single payment installment to a new date
   * @param installmentId The installment ID to reschedule
   * @param newDueDate The new due date for the installment
   * @returns Object indicating success or failure
   */
  static async reschedulePayment(installmentId: string, newDueDate: Date): Promise<{ success: boolean, error?: any }> {
    try {
      console.log(`Starting reschedulePayment for installment: ${installmentId} to date: ${newDueDate}`);
      
      // 1. Get the installment details
      const { data: installment, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('id', installmentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching installment details:', fetchError);
        throw fetchError;
      }
      
      if (!installment) {
        return { success: false, error: 'Installment not found' };
      }
      
      // 2. Check if there's an existing payment request for this installment that needs to be cancelled
      if (installment.payment_request_id) {
        console.log(`Found payment_request_id: ${installment.payment_request_id}, cancelling it before reschedule`);
        
        const { error: cancelRequestError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled'
          })
          .eq('id', installment.payment_request_id);
          
        if (cancelRequestError) {
          console.warn('Error cancelling payment request:', cancelRequestError);
          // Non-fatal error, continue processing
        } else {
          console.log(`Successfully cancelled payment request ${installment.payment_request_id}`);
        }
      }
      
      // 3. Update the payment schedule with the new due date and reset status to pending
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({
          due_date: newDueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          status: 'pending', // Reset the status to pending
          payment_request_id: null, // Clear the link to the cancelled payment request
          updated_at: new Date().toISOString()
        })
        .eq('id', installmentId);
      
      if (updateError) {
        console.error('Error updating payment schedule:', updateError);
        throw updateError;
      }
      
      // 4. Update the plan's next_due_date if this is now the next upcoming payment
      try {
        // Find the next unpaid installment for this plan
        const { data: nextUnpaid, error: nextError } = await supabase
          .from('payment_schedule')
          .select('due_date, plan_id')
          .not('status', 'in', '("paid","cancelled")') // Exclude paid and cancelled installments
          .order('due_date', { ascending: true })
          .eq('plan_id', installment.plan_id)
          .limit(1)
          .maybeSingle();
        
        if (nextError) {
          console.warn('Error finding next unpaid installment:', nextError);
        } else if (nextUnpaid) {
          console.log(`Found next unpaid installment with due date: ${nextUnpaid.due_date}`);
          
          // Update the plan's next_due_date
          const { error: updatePlanError } = await supabase
            .from('plans')
            .update({
              next_due_date: nextUnpaid.due_date,
              updated_at: new Date().toISOString()
            })
            .eq('id', installment.plan_id);
            
          if (updatePlanError) {
            console.warn('Error updating plan next_due_date:', updatePlanError);
          } else {
            console.log(`Updated plan next_due_date to ${nextUnpaid.due_date}`);
          }
        }
      } catch (nextDueError) {
        console.error('Error updating next_due_date:', nextDueError);
        // Non-fatal error, continue processing
      }
      
      // 5. Record the activity
      await this.recordPaymentPlanActivity({
        planId: installment.plan_id,
        actionType: 'payment_rescheduled',
        details: {
          installmentId,
          paymentNumber: installment.payment_number,
          oldDueDate: installment.due_date,
          newDueDate: newDueDate.toISOString().split('T')[0],
          cancelledPaymentRequest: !!installment.payment_request_id
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error rescheduling payment:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  
  /**
   * Record activity for a payment plan
   * @param params Parameters for recording activity
   * @returns Promise indicating success or failure
   */
  private static async recordPaymentPlanActivity(params: {
    planId: string;
    actionType: string;
    details: Record<string, any>;
  }): Promise<boolean> {
    try {
      // Get plan information to fill in required fields
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('payment_link_id, patient_id, clinic_id')
        .eq('id', params.planId)
        .single();
      
      if (planError) {
        console.error('Error fetching plan data for activity log:', planError);
        return false;
      }
      
      // Insert activity record
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          plan_id: params.planId,
          payment_link_id: planData.payment_link_id,
          patient_id: planData.patient_id,
          clinic_id: planData.clinic_id,
          action_type: params.actionType,
          details: params.details
        });
      
      if (activityError) {
        console.error('Error recording payment plan activity:', activityError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in recordPaymentPlanActivity:', error);
      return false;
    }
  }
}
