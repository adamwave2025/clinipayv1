
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Service for handling payment-related operations within plans
 */
export class PlanPaymentService {
  /**
   * Reschedule a payment to a new date
   */
  static async reschedulePayment(paymentId: string, newDate: Date): Promise<{ success: boolean, error?: any }> {
    try {
      // Format date as YYYY-MM-DD using date-fns
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      console.log('Rescheduling payment with formatted date:', formattedDate);
      
      // First get the current payment schedule entry to see if it has a payment request
      const { data: scheduleEntry, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('payment_request_id, status, due_date, plan_id')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment schedule:', fetchError);
        throw fetchError;
      }
      
      // If there's a payment request, cancel it
      if (scheduleEntry.payment_request_id) {
        console.log(`Cancelling payment request: ${scheduleEntry.payment_request_id}`);
        const { error: cancelError } = await supabase
          .from('payment_requests')
          .update({ status: 'cancelled' })
          .eq('id', scheduleEntry.payment_request_id);
          
        if (cancelError) {
          console.error('Error cancelling payment request:', cancelError);
          throw cancelError;
        }
      }
      
      // Update the payment schedule with the new date
      const { data: updatedSchedule, error: updateError } = await supabase
        .from('payment_schedule')
        .update({
          due_date: formattedDate,
          status: 'pending', // Reset status to pending
          payment_request_id: null, // Clear payment request ID
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select();
        
      if (updateError) {
        console.error('Error updating payment schedule:', updateError);
        throw updateError;
      }
      
      // Log the activity
      if (scheduleEntry.plan_id) {
        // Get plan and patient details
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('id, title, patient_id, clinic_id, payment_link_id')
          .eq('id', scheduleEntry.plan_id)
          .single();
          
        if (planError) {
          console.error('Error fetching plan data:', planError);
        } else {
          // Record the activity
          await supabase.from('payment_activity').insert({
            plan_id: planData.id,
            payment_link_id: planData.payment_link_id,
            patient_id: planData.patient_id,
            clinic_id: planData.clinic_id,
            action_type: 'reschedule_payment',
            details: {
              previous_date: scheduleEntry.due_date,
              new_date: formattedDate,
              payment_request_cancelled: scheduleEntry.payment_request_id ? true : false
            }
          });
        }
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error in reschedulePayment:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Record a manual payment for an installment
   */
  static async recordManualPayment(paymentId: string): Promise<{ success: boolean, error?: any }> {
    try {
      // First get the payment schedule entry
      const { data: scheduleEntry, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('id, plan_id, amount, payment_number, total_payments, patient_id, clinic_id, payment_link_id, due_date')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment schedule:', fetchError);
        throw fetchError;
      }
      
      // Create a payment record for the manual payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_schedule_id: scheduleEntry.id,
          amount_paid: scheduleEntry.amount,
          status: 'paid',
          manual_payment: true,
          patient_id: scheduleEntry.patient_id,
          clinic_id: scheduleEntry.clinic_id,
          payment_link_id: scheduleEntry.payment_link_id,
          paid_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError;
      }
      
      // Update the payment schedule status
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
        
      if (updateError) {
        console.error('Error updating payment schedule:', updateError);
        throw updateError;
      }
      
      // Update the plan progress
      if (scheduleEntry.plan_id) {
        // Get current plan data
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('paid_installments, total_installments, progress')
          .eq('id', scheduleEntry.plan_id)
          .single();
          
        if (planError) {
          console.error('Error fetching plan data:', planError);
        } else {
          // Calculate new progress values
          const newPaidInstallments = (planData.paid_installments || 0) + 1;
          const newProgress = Math.round((newPaidInstallments / planData.total_installments) * 100);
          
          // Update the plan
          const { error: planUpdateError } = await supabase
            .from('plans')
            .update({
              paid_installments: newPaidInstallments,
              progress: newProgress,
              updated_at: new Date().toISOString()
            })
            .eq('id', scheduleEntry.plan_id);
            
          if (planUpdateError) {
            console.error('Error updating plan progress:', planUpdateError);
          }
        }
        
        // Record the activity
        await supabase.from('payment_activity').insert({
          plan_id: scheduleEntry.plan_id,
          payment_link_id: scheduleEntry.payment_link_id,
          patient_id: scheduleEntry.patient_id,
          clinic_id: scheduleEntry.clinic_id,
          action_type: 'manual_payment_recorded',
          details: {
            payment_id: payment.id,
            amount: scheduleEntry.amount,
            payment_number: scheduleEntry.payment_number,
            total_payments: scheduleEntry.total_payments,
            due_date: scheduleEntry.due_date
          }
        });
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error in recordManualPayment:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Record a refund for a payment
   */
  static async recordPaymentRefund(paymentId: string, amount: number, isFullRefund: boolean): Promise<{ success: boolean, error?: any }> {
    // Implement refund functionality
    return { success: true };
  }
  
  /**
   * Send a payment reminder for an installment
   */
  static async sendPaymentReminder(installmentId: string): Promise<{ success: boolean, error?: any }> {
    // Implement send reminder functionality
    return { success: true };
  }
}
