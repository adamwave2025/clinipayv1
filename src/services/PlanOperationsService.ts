
import { Plan } from '@/utils/planTypes';
import { PlanCancelService } from './plan-operations/PlanCancelService';
import { PlanPauseService } from './plan-operations/PlanPauseService';
import { PlanResumeService } from './plan-operations/PlanResumeService';
import { PlanRescheduleService } from './plan-operations/PlanRescheduleService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Consolidated service for payment plan operations
 * This service delegates to specialized services for specific operations
 */
export class PlanOperationsService {
  /**
   * Cancel a payment plan
   * @param plan The plan to cancel
   * @returns boolean indicating success or failure 
   */
  static async cancelPlan(plan: Plan): Promise<boolean> {
    // Delegate directly to PlanCancelService without duplicating activity logging
    return PlanCancelService.cancelPlan(plan);
  }
  
  /**
   * Pause a payment plan
   * @param plan The plan to pause
   * @param reason Optional reason for pausing
   * @returns boolean indicating success or failure
   */
  static async pausePlan(plan: Plan, reason?: string): Promise<boolean> {
    return PlanPauseService.pausePlan(plan, reason);
  }
  
  /**
   * Resume a paused payment plan
   * @param plan The plan to resume
   * @param resumeDate The date to resume payments from
   * @returns boolean indicating success or failure
   */
  static async resumePlan(plan: Plan, resumeDate: Date): Promise<boolean> {
    return PlanResumeService.resumePlan(plan, resumeDate);
  }
  
  /**
   * Reschedule a payment plan
   * @param plan The plan to reschedule
   * @param newStartDate The new start date for the plan
   * @returns boolean indicating success or failure
   */
  static async reschedulePlan(plan: Plan, newStartDate: Date): Promise<boolean> {
    return PlanRescheduleService.reschedulePlan(plan, newStartDate);
  }

  /**
   * Reschedule a single payment
   * @param paymentId The ID of the payment to reschedule
   * @param newDate The new date for the payment
   * @returns {success: boolean, error?: any} Result object
   */
  static async reschedulePayment(paymentId: string, newDate: Date): Promise<{success: boolean, error?: any}> {
    try {
      console.log(`Rescheduling payment ${paymentId} to ${newDate.toISOString()}`);
      
      // Update the payment schedule entry with the new date
      const { error } = await supabase
        .from('payment_schedule')
        .update({ 
          due_date: newDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
          // Reset to pending if it was in any other state (except paid)
          status: 'pending'
        })
        .eq('id', paymentId)
        .neq('status', 'paid');
      
      if (error) throw error;
      
      // Get the plan ID for this payment for activity logging
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('plan_id, clinic_id, patient_id, payment_link_id')
        .eq('id', paymentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Log the activity
      await supabase
        .from('payment_activity')
        .insert({
          plan_id: paymentData.plan_id,
          clinic_id: paymentData.clinic_id,
          patient_id: paymentData.patient_id,
          payment_link_id: paymentData.payment_link_id,
          action_type: 'payment_rescheduled',
          details: {
            payment_id: paymentId,
            new_date: newDate.toISOString().split('T')[0]
          }
        });
      
      return { success: true };
    } catch (error) {
      console.error('Error rescheduling payment:', error);
      return { success: false, error };
    }
  }

  /**
   * Mark a payment as paid manually
   * @param paymentId The ID of the payment to mark as paid
   * @param planId The ID of the plan containing the payment
   * @returns boolean indicating success or failure
   */
  static async markAsPaid(paymentId: string, planId: string): Promise<boolean> {
    try {
      // Get payment details for accurate logging
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('amount, clinic_id, patient_id, payment_link_id, plan_id')
        .eq('id', paymentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update payment status
      const { error } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
        
      if (error) throw error;
      
      // Create a payment record for this manual payment
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_schedule_id: paymentId,
          amount_paid: paymentData.amount,
          status: 'succeeded',
          manual_payment: true,
          paid_at: new Date().toISOString(),
          clinic_id: paymentData.clinic_id,
          patient_id: paymentData.patient_id,
          payment_link_id: paymentData.payment_link_id
        })
        .select()
        .single();
        
      if (paymentError) throw paymentError;
      
      // Log activity
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          plan_id: planId,
          clinic_id: paymentData.clinic_id,
          patient_id: paymentData.patient_id,
          payment_link_id: paymentData.payment_link_id,
          action_type: 'payment_marked_paid',
          details: {
            payment_id: paymentId,
            amount: paymentData.amount,
            payment_record_id: paymentRecord.id
          }
        });
        
      if (activityError) {
        console.error('Error logging activity:', activityError);
      }
      
      // Update plan progress stats
      await updatePlanProgress(planId);
      
      return true;
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      return false;
    }
  }

  /**
   * Send a payment reminder for an installment
   * @param installmentId The ID of the installment to send a reminder for
   * @returns {success: boolean, error?: any} Result object
   */
  static async sendPaymentReminder(installmentId: string): Promise<{success: boolean, error?: any}> {
    try {
      // Get the payment details
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_schedule')
        .select(`
          id,
          amount,
          due_date,
          plan_id,
          clinic_id,
          patient_id,
          payment_link_id,
          plans (
            title
          ),
          patients (
            name,
            email
          )
        `)
        .eq('id', installmentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Create a payment request entry 
      const { data: paymentRequest, error: requestError } = await supabase
        .from('payment_requests')
        .insert({
          payment_link_id: paymentData.payment_link_id,
          patient_id: paymentData.patient_id,
          patient_name: paymentData.patients.name,
          patient_email: paymentData.patients.email,
          status: 'sent',
          message: `Reminder for ${paymentData.plans.title}: Payment due on ${new Date(paymentData.due_date).toLocaleDateString()}`,
          clinic_id: paymentData.clinic_id,
          custom_amount: paymentData.amount
        })
        .select()
        .single();
        
      if (requestError) throw requestError;
      
      // Update the payment schedule with the request ID
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({ 
          payment_request_id: paymentRequest.id,
          status: 'sent'
        })
        .eq('id', installmentId);
        
      if (updateError) throw updateError;
      
      // Queue a notification
      await supabase
        .from('notification_queue')
        .insert({
          type: 'payment_reminder',
          recipient_type: 'patient',
          payload: {
            payment_id: installmentId,
            patient_id: paymentData.patient_id,
            patient_email: paymentData.patients.email,
            patient_name: paymentData.patients.name,
            payment_amount: paymentData.amount,
            due_date: paymentData.due_date,
            plan_title: paymentData.plans.title,
            payment_request_id: paymentRequest.id
          }
        });
        
      // Log activity
      await supabase
        .from('payment_activity')
        .insert({
          plan_id: paymentData.plan_id,
          clinic_id: paymentData.clinic_id,
          patient_id: paymentData.patient_id,
          payment_link_id: paymentData.payment_link_id,
          action_type: 'payment_reminder_sent',
          details: {
            payment_id: installmentId,
            payment_request_id: paymentRequest.id
          }
        });
      
      return { success: true };
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return { success: false, error };
    }
  }

  /**
   * Record a refund for a payment
   * @param paymentId The ID of the payment to refund
   * @param amount The amount to refund
   * @param isFullRefund Whether this is a full refund
   * @returns {success: boolean, error?: any} Result object
   */
  static async recordPaymentRefund(paymentId: string, amount: number, isFullRefund: boolean): Promise<{success: boolean, error?: any}> {
    try {
      // Get payment details
      const { data: paymentData, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update payment with refund details
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          status: isFullRefund ? 'refunded' : 'partially_refunded',
          refunded_at: new Date().toISOString(),
          refund_amount: amount
        })
        .eq('id', paymentId);
        
      if (updateError) throw updateError;
      
      // If this payment has an associated schedule entry, update it too
      if (paymentData.payment_schedule_id) {
        const { error: scheduleError } = await supabase
          .from('payment_schedule')
          .update({ 
            status: isFullRefund ? 'refunded' : 'partially_paid'
          })
          .eq('id', paymentData.payment_schedule_id);
          
        if (scheduleError) throw scheduleError;
        
        // If this is part of a plan, update the plan progress
        const { data: scheduleData } = await supabase
          .from('payment_schedule')
          .select('plan_id')
          .eq('id', paymentData.payment_schedule_id)
          .single();
          
        if (scheduleData?.plan_id) {
          await updatePlanProgress(scheduleData.plan_id);
        }
      }
      
      // Log activity
      await supabase
        .from('payment_activity')
        .insert({
          clinic_id: paymentData.clinic_id,
          patient_id: paymentData.patient_id,
          payment_link_id: paymentData.payment_link_id,
          action_type: isFullRefund ? 'payment_refunded' : 'payment_partially_refunded',
          details: {
            payment_id: paymentId,
            amount_refunded: amount,
            original_amount: paymentData.amount_paid
          }
        });
      
      return { success: true };
    } catch (error) {
      console.error('Error recording refund:', error);
      return { success: false, error };
    }
  }

  /**
   * Update plan progress metrics
   * @private
   */
  private static async updatePlanProgress(planId: string): Promise<void> {
    try {
      // Count total paid installments
      const { count: paidCount, error: countError } = await supabase
        .from('payment_schedule')
        .select('id', { count: 'exact' })
        .eq('plan_id', planId)
        .eq('status', 'paid');
        
      if (countError) throw countError;
      
      // Get plan total installments
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('total_installments')
        .eq('id', planId)
        .single();
        
      if (planError) throw planError;
      
      // Calculate progress percentage
      const progress = Math.round((paidCount / planData.total_installments) * 100);
      
      // Update plan with new progress
      const { error: updateError } = await supabase
        .from('plans')
        .update({ 
          paid_installments: paidCount,
          progress: progress,
          status: progress === 100 ? 'completed' : 'active'
        })
        .eq('id', planId);
        
      if (updateError) throw updateError;
      
    } catch (error) {
      console.error('Error updating plan progress:', error);
    }
  }
}
