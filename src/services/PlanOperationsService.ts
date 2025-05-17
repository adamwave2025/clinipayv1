import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { toast } from 'sonner';
import { PlanRescheduleService } from './plan-operations/PlanRescheduleService';
import { PlanCancelService } from './plan-operations/PlanCancelService';
import { PlanPauseService } from './plan-operations/PlanPauseService';
import { format } from 'date-fns';
import { PlanPaymentService } from './plan-operations/PlanPaymentService';
import { PlanResumeService } from './plan-operations/PlanResumeService';

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
      
      // Delegate to PlanCancelService for full implementation
      const success = await PlanCancelService.cancelPlan(plan);
      
      if (!success) {
        console.error('Error in PlanCancelService.cancelPlan');
        return false;
      }
      
      // Log activity if not already logged by the service
      try {
        await this.logPlanActivity(plan.id, 'plan_cancelled', { 
          planId: plan.id,
          planName: plan.title || plan.planName,
          cancelledAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not log plan activity for cancellation:', err);
      }
      
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
      
      // Delegate to PlanPauseService for full implementation
      // Note: PlanPauseService already handles activity logging, so we don't need to log it again here
      const success = await PlanPauseService.pausePlan(plan);
      
      if (!success) {
        console.error('Error in PlanPauseService.pausePlan');
        return false;
      }
      
      // Remove duplicate activity logging since it's already done in PlanPauseService
      
      return true;
    } catch (err) {
      console.error('Error in pausePlan:', err);
      return false;
    }
  }
  
  /**
   * Resume a plan that was previously paused
   * @param plan The plan to resume
   * @param resumeDate Optional date to resume from (defaults to tomorrow if not provided)
   * @returns Promise<boolean> Success or failure
   */
  static async resumePlan(plan: Plan, resumeDate?: Date): Promise<boolean> {
    try {
      console.log(`PlanOperationsService: Resuming plan ${plan.id}`);
      const result = await PlanResumeService.resumePlan(plan, resumeDate);
      
      if (result) {
        toast.success('Payment plan resumed successfully');
      } else {
        toast.error('Failed to resume payment plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error resuming plan:', error);
      toast.error(`Failed to resume plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      // Delegate to PlanRescheduleService for full implementation
      const success = await PlanRescheduleService.reschedulePlan(plan, newStartDate);
      
      if (!success) {
        console.error('Error in PlanRescheduleService.reschedulePlan');
        return false;
      }
      
      // Log activity if not already logged by the service
      try {
        await this.logPlanActivity(plan.id, 'plan_rescheduled', { 
          planId: plan.id,
          planName: plan.title || plan.planName,
          oldStartDate: plan.startDate,
          newStartDate: format(newStartDate, 'yyyy-MM-dd')
        });
      } catch (err) {
        console.warn('Could not log plan activity for reschedule operation:', err);
      }
      
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
      
      // Format date properly for database
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      console.log('Rescheduling payment to formatted date:', formattedDate);
      
      // Get the payment schedule item to retrieve plan ID for logging
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('plan_id, due_date, payment_number, total_payments, amount, status, payment_request_id')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment data:', fetchError);
        return { success: false, error: fetchError };
      }
      
      // Update the payment schedule with new date and set status to pending if it was sent
      const updateData: any = { 
        due_date: formattedDate, // Store only the date part
        updated_at: new Date().toISOString()
      };
      
      // If payment was in 'sent' status, revert it to 'pending'
      if (paymentData.status === 'sent') {
        updateData.status = 'pending';
        
        // Cancel the associated payment request if it exists
        if (paymentData.payment_request_id) {
          const { error: cancelError } = await supabase
            .from('payment_requests')
            .update({ status: 'cancelled' })
            .eq('id', paymentData.payment_request_id);
            
          if (cancelError) {
            console.error('Error cancelling payment request:', cancelError);
            // Continue anyway since the main operation is rescheduling
          }
        }
      }
      
      const { error } = await supabase
        .from('payment_schedule')
        .update(updateData)
        .eq('id', paymentId);
      
      if (error) {
        console.error('Error rescheduling payment:', error);
        return { success: false, error: error };
      }
      
      // Log activity if we have a plan ID
      if (paymentData?.plan_id) {
        // Get additional plan details needed for activity logging
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('payment_link_id, patient_id, clinic_id, title')
          .eq('id', paymentData.plan_id)
          .single();
          
        if (planError) {
          console.error('Error fetching plan data for activity log:', planError);
          // Continue anyway since the payment was rescheduled successfully
        } else if (planData) {
          // Log the activity with all required fields
          const { error: activityError } = await supabase
            .from('payment_activity')
            .insert({
              plan_id: paymentData.plan_id,
              payment_link_id: planData.payment_link_id,
              patient_id: planData.patient_id,
              clinic_id: planData.clinic_id,
              action_type: 'payment_rescheduled',
              details: {
                paymentId,
                paymentNumber: paymentData.payment_number,
                totalPayments: paymentData.total_payments,
                amount: paymentData.amount,
                oldDueDate: paymentData.due_date,
                newDate: formattedDate,
                planName: planData.title,
                status: paymentData.status,
                payment_request_cancelled: paymentData.payment_request_id ? true : false
              }
            });
            
          if (activityError) {
            console.error('Error logging payment reschedule activity:', activityError);
          }
        }
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
      
      console.log(`Marking installment ${installmentId} as paid for plan ${planId}`);
      
      // Use the PlanPaymentService for consistent implementation
      // This method handles all the necessary operations including:
      // - Creating a payment record
      // - Checking for associated payment requests
      // - Updating the payment schedule status
      // - Updating the plan progress and metrics
      // - Recording activity
      const result = await PlanPaymentService.recordManualPayment(installmentId);
      
      if (!result.success) {
        console.error('Failed to record manual payment:', result.error);
        return false;
      }
      
      // Make sure we have an activity log entry for manual payment
      if (planId) {
        // Get the payment schedule data for the activity log
        const { data: scheduleData } = await supabase
          .from('payment_schedule')
          .select('payment_number, total_payments, amount, due_date')
          .eq('id', installmentId)
          .single();
          
        if (scheduleData) {
          await this.logPlanActivity(planId, 'payment_marked_paid', { 
            installmentId: installmentId,
            paymentNumber: scheduleData.payment_number,
            totalPayments: scheduleData.total_payments,
            amount: scheduleData.amount,
            dueDate: scheduleData.due_date,
            paidAt: new Date().toISOString(),
            manualPayment: true
          });
        }
      }
      
      console.log('Payment successfully marked as paid');
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
        .select('plan_id, patient_id, due_date, payment_number, total_payments, amount')
        .eq('id', installmentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment data:', fetchError);
        return { success: false, error: fetchError };
      }
      
      // Log that a reminder was sent
      if (paymentData?.plan_id) {
        // Get plan details for the activity
        const { data: planData } = await supabase
          .from('plans')
          .select('payment_link_id, clinic_id, title')
          .eq('id', paymentData.plan_id)
          .single();
          
        if (planData) {
          await this.logPlanActivity(paymentData.plan_id, 'payment_reminder_sent', { 
            installmentId,
            paymentNumber: paymentData.payment_number,
            totalPayments: paymentData.total_payments,
            amount: paymentData.amount,
            dueDate: paymentData.due_date,
            sentAt: new Date().toISOString(),
            planName: planData.title
          });
        }
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
          .select('plan_id, payment_number, total_payments')
          .eq('id', paymentData.payment_schedule_id)
          .single();
          
        if (scheduleData) {
          planId = scheduleData.plan_id;
          
          // Log activity if we have a plan ID
          if (planId) {
            await this.logPlanActivity(planId, 'payment_refunded', { 
              paymentId,
              refundAmount,
              originalAmount: paymentData.amount_paid,
              isFullRefund,
              refundedAt: now,
              paymentNumber: scheduleData.payment_number,
              totalPayments: scheduleData.total_payments
            });
          }
        }
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
        .select('clinic_id, patient_id, payment_link_id, title')
        .eq('id', planId)
        .single();
      
      if (!planData) {
        console.error('Could not find plan for activity logging');
        return;
      }
      
      // Add plan name to details if it's not already there
      if (!details.planName && planData.title) {
        details.planName = planData.title;
      }
      
      // Insert activity record with all required fields including payment_link_id
      const { data, error } = await supabase.from('payment_activity').insert({
        plan_id: planId,
        clinic_id: planData.clinic_id,
        patient_id: planData.patient_id,
        payment_link_id: planData.payment_link_id,
        action_type: actionType,
        details: details,
        performed_at: new Date().toISOString()
      }).select();
      
      if (error) {
        console.error('Error logging plan activity:', error);
      } else {
        console.log(`Successfully logged "${actionType}" activity for plan ${planId}:`, data);
      }
    } catch (err) {
      console.error('Error logging plan activity:', err);
    }
  }
}
