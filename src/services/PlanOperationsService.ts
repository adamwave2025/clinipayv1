
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { toast } from 'sonner';

/**
 * Service for performing operations on payment plans
 */
export class PlanOperationsService {
  /**
   * Cancel a payment plan
   */
  static async cancelPlan(plan: Plan): Promise<boolean> {
    try {
      if (!plan || !plan.id) {
        console.error('Cannot cancel plan: Invalid plan object');
        return false;
      }
      
      // Update the plan status to cancelled
      const { error } = await supabase
        .from('plans')
        .update({ status: 'cancelled' })
        .eq('id', plan.id);
      
      if (error) {
        console.error('Error cancelling plan:', error);
        throw error;
      }
      
      // Log activity
      await this.logPlanActivity(plan.id, 'plan_cancelled', { 
        planId: plan.id,
        planName: plan.title || plan.planName 
      });
      
      return true;
    } catch (err) {
      console.error('Error in cancelPlan:', err);
      return false;
    }
  }
  
  /**
   * Pause a payment plan
   */
  static async pausePlan(plan: Plan): Promise<boolean> {
    try {
      if (!plan || !plan.id) {
        console.error('Cannot pause plan: Invalid plan object');
        return false;
      }
      
      // Update the plan status to paused
      const { error } = await supabase
        .from('plans')
        .update({ status: 'paused' })
        .eq('id', plan.id);
      
      if (error) {
        console.error('Error pausing plan:', error);
        throw error;
      }
      
      // Log activity
      await this.logPlanActivity(plan.id, 'plan_paused', { 
        planId: plan.id,
        planName: plan.title || plan.planName 
      });
      
      return true;
    } catch (err) {
      console.error('Error in pausePlan:', err);
      return false;
    }
  }
  
  /**
   * Resume a payment plan
   */
  static async resumePlan(plan: Plan, resumeDate: Date): Promise<boolean> {
    try {
      if (!plan || !plan.id) {
        console.error('Cannot resume plan: Invalid plan object');
        return false;
      }
      
      // Format date for database
      const formattedDate = resumeDate.toISOString();
      
      // Update the plan status to active and set next due date
      const { error } = await supabase
        .from('plans')
        .update({ 
          status: 'active',
          next_due_date: formattedDate
        })
        .eq('id', plan.id);
      
      if (error) {
        console.error('Error resuming plan:', error);
        throw error;
      }
      
      // Log activity
      await this.logPlanActivity(plan.id, 'plan_resumed', { 
        planId: plan.id,
        planName: plan.title || plan.planName,
        resumeDate: formattedDate
      });
      
      return true;
    } catch (err) {
      console.error('Error in resumePlan:', err);
      return false;
    }
  }
  
  /**
   * Reschedule a payment plan
   */
  static async reschedulePlan(plan: Plan, newStartDate: Date): Promise<boolean> {
    try {
      if (!plan || !plan.id) {
        console.error('Cannot reschedule plan: Invalid plan object');
        return false;
      }
      
      // Format date for database
      const formattedDate = newStartDate.toISOString();
      
      // Update the plan with new start date
      const { error } = await supabase
        .from('plans')
        .update({ 
          start_date: formattedDate,
          next_due_date: formattedDate
        })
        .eq('id', plan.id);
      
      if (error) {
        console.error('Error rescheduling plan:', error);
        throw error;
      }
      
      // Log activity
      await this.logPlanActivity(plan.id, 'plan_rescheduled', { 
        planId: plan.id,
        planName: plan.title || plan.planName,
        newStartDate: formattedDate
      });
      
      return true;
    } catch (err) {
      console.error('Error in reschedulePlan:', err);
      return false;
    }
  }
  
  /**
   * Reschedule a single payment
   */
  static async reschedulePayment(paymentId: string, newDate: Date): Promise<{success: boolean, error?: any}> {
    try {
      if (!paymentId) {
        console.error('Cannot reschedule payment: Invalid payment ID');
        return { success: false, error: 'Invalid payment ID' };
      }
      
      // Format date for database
      const formattedDate = newDate.toISOString();
      
      // Get the payment schedule item to retrieve plan ID for logging
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('plan_id')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment data:', fetchError);
        return { success: false, error: fetchError };
      }
      
      // Update the payment schedule with new date
      const { error } = await supabase
        .from('payment_schedule')
        .update({ 
          due_date: formattedDate.split('T')[0], // Store only the date part
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (error) {
        console.error('Error rescheduling payment:', error);
        return { success: false, error: error };
      }
      
      // Log activity if we have a plan ID
      if (paymentData?.plan_id) {
        await this.logPlanActivity(paymentData.plan_id, 'payment_rescheduled', { 
          paymentId,
          newDueDate: formattedDate
        });
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error in reschedulePayment:', err);
      return { success: false, error: err };
    }
  }
  
  /**
   * Mark a payment as paid
   */
  static async markAsPaid(installmentId: string, planId: string): Promise<boolean> {
    try {
      if (!installmentId) {
        console.error('Cannot mark as paid: Invalid installment ID');
        return false;
      }
      
      // Get current date
      const now = new Date();
      const paidDate = now.toISOString();
      
      // Update the payment schedule item as paid
      const { error } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'paid',
          paid_date: paidDate
        })
        .eq('id', installmentId);
      
      if (error) {
        console.error('Error marking payment as paid:', error);
        throw error;
      }
      
      // Log activity if we have a plan ID
      if (planId) {
        await this.logPlanActivity(planId, 'payment_marked_paid', { 
          installmentId,
          paidDate
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error in markAsPaid:', err);
      return false;
    }
  }
  
  /**
   * Send a payment reminder
   */
  static async sendPaymentReminder(installmentId: string): Promise<{success: boolean, error?: any}> {
    try {
      if (!installmentId) {
        console.error('Cannot send reminder: Invalid installment ID');
        return { success: false, error: 'Invalid installment ID' };
      }
      
      // Get the payment schedule item to retrieve plan ID and patient details
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('plan_id, patient_id')
        .eq('id', installmentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment data:', fetchError);
        return { success: false, error: fetchError };
      }
      
      // Log that a reminder was sent
      if (paymentData?.plan_id) {
        await this.logPlanActivity(paymentData.plan_id, 'payment_reminder_sent', { 
          installmentId,
          sentAt: new Date().toISOString()
        });
      }
      
      toast.success('Payment reminder sent successfully');
      return { success: true };
    } catch (err) {
      console.error('Error in sendPaymentReminder:', err);
      toast.error('Failed to send payment reminder');
      return { success: false, error: err };
    }
  }
  
  /**
   * Record a payment refund
   */
  static async recordPaymentRefund(
    paymentId: string, 
    amount: number, 
    isFullRefund: boolean
  ): Promise<{success: boolean, error?: any}> {
    try {
      if (!paymentId) {
        console.error('Cannot record refund: Invalid payment ID');
        return { success: false, error: 'Invalid payment ID' };
      }
      
      // Get the current payment details
      const { data: paymentData, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment data:', fetchError);
        return { success: false, error: fetchError };
      }
      
      const refundAmount = isFullRefund ? paymentData.amount_paid : amount;
      const now = new Date().toISOString();
      
      // Update the payment with refund details
      const { error } = await supabase
        .from('payments')
        .update({ 
          refund_amount: refundAmount,
          refunded_at: now,
          status: isFullRefund ? 'refunded' : 'partially_refunded'
        })
        .eq('id', paymentId);
      
      if (error) {
        console.error('Error recording refund:', error);
        return { success: false, error: error };
      }
      
      // Get the plan ID associated with this payment if any
      let planId = null;
      if (paymentData.payment_schedule_id) {
        const { data: scheduleData } = await supabase
          .from('payment_schedule')
          .select('plan_id')
          .eq('id', paymentData.payment_schedule_id)
          .single();
          
        if (scheduleData) {
          planId = scheduleData.plan_id;
        }
      }
      
      // Log activity if we have a plan ID
      if (planId) {
        await this.logPlanActivity(planId, 'payment_refunded', { 
          paymentId,
          refundAmount,
          isFullRefund,
          refundedAt: now
        });
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error in recordPaymentRefund:', err);
      return { success: false, error: err };
    }
  }
  
  /**
   * Log an activity for a plan
   */
  private static async logPlanActivity(planId: string, actionType: string, details: any): Promise<void> {
    try {
      // Get clinic ID and payment_link_id for the plan
      const { data: planData } = await supabase
        .from('plans')
        .select('clinic_id, patient_id, payment_link_id')
        .eq('id', planId)
        .single();
      
      if (!planData) {
        console.error('Could not find plan for activity logging');
        return;
      }
      
      // Insert activity record with all required fields including payment_link_id
      await supabase.from('payment_activity').insert({
        plan_id: planId,
        clinic_id: planData.clinic_id,
        patient_id: planData.patient_id,
        payment_link_id: planData.payment_link_id, // Ensure payment_link_id is included
        action_type: actionType,
        details: details,
        performed_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error logging plan activity:', err);
    }
  }
}
