
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
import { toast } from 'sonner';
import { isPaymentStatusModifiable, getModifiableStatuses } from '@/utils/paymentStatusUtils';
import { determinePlanStatus } from '@/utils/plan-status-utils';

/**
 * Service for performing operations on payment plans
 */
export class PlanOperationsService {
  /**
   * Cancel a payment plan
   */
  static async cancelPlan(plan: Plan): Promise<boolean> {
    try {
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: 'cancelled' })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all pending payment schedules to cancelled
      // Only update schedules that are in a modifiable state (not paid)
      const modifiableStatuses = getModifiableStatuses();
      
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'cancelled' })
        .eq('plan_id', plan.id)
        .in('status', modifiableStatuses);
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_activity') // Fixed: Changed from payment_plan_activities to payment_activity
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          action_type: 'cancel_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: plan.status
          }
        });
      
      if (activityError) {
        console.error('Error logging cancel activity:', activityError);
      }
      
      toast.success('Payment plan cancelled successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error cancelling plan:', error);
      toast.error('Failed to cancel plan: ' + error.message);
      return false;
    }
  }
  
  /**
   * Pause a payment plan
   */
  static async pausePlan(plan: Plan): Promise<boolean> {
    try {
      // Track original statuses for activity log
      const { data: originalSchedules, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('id, status')
        .eq('plan_id', plan.id)
        .in('status', getModifiableStatuses());
        
      if (fetchError) throw fetchError;
      
      // Count of schedules by status type for logging
      const statusCounts = {
        pending: 0,
        sent: 0,
        overdue: 0
      };
      
      originalSchedules?.forEach(schedule => {
        if (schedule.status === 'pending') statusCounts.pending++;
        if (schedule.status === 'sent') statusCounts.sent++;
        if (schedule.status === 'overdue') statusCounts.overdue++;
      });
      
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: 'paused' })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all pending, sent, and overdue payment schedules to paused
      // Only update schedules that are in a modifiable state (not paid)
      const modifiableStatuses = getModifiableStatuses();
      
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', plan.id)
        .in('status', modifiableStatuses);
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Add an activity log entry with detailed information about what was paused
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          action_type: 'pause_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: plan.status,
            installments_affected: originalSchedules?.length || 0,
            pending_count: statusCounts.pending,
            sent_count: statusCounts.sent,
            overdue_count: statusCounts.overdue
          }
        });
      
      if (activityError) {
        console.error('Error logging pause activity:', activityError);
      }
      
      toast.success('Payment plan paused successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error pausing plan:', error);
      toast.error('Failed to pause plan: ' + error.message);
      return false;
    }
  }
  
  /**
   * Resume a payment plan
   */
  static async resumePlan(plan: Plan, resumeDate?: Date): Promise<boolean> {
    try {
      // If resumeDate is not provided, use current date
      const effectiveResumeDate = resumeDate || new Date();
      console.log('Resuming plan with date:', effectiveResumeDate);
      
      // Get the current paused payments to track what's being resumed
      const { data: pausedSchedules, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('id, status, payment_request_id, due_date')
        .eq('plan_id', plan.id)
        .eq('status', 'paused');
        
      if (fetchError) throw fetchError;
      
      // Count payments with payment requests that need to be reset
      let sentPaymentsCount = 0;
      const paymentRequestIds = [];
      
      for (const schedule of pausedSchedules || []) {
        if (schedule.payment_request_id) {
          sentPaymentsCount++;
          paymentRequestIds.push(schedule.payment_request_id);
        }
      }
      
      // Determine what the plan status should be based on payment history
      const newStatus = await determinePlanStatus(plan.id);
      console.log('Determined plan status after resume:', newStatus);
      
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: newStatus })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Reset any payment requests that were sent but not paid
      if (paymentRequestIds.length > 0) {
        const { error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('id', paymentRequestIds)
          .is('payment_id', null); // Only update requests that don't have a payment (not paid)
          
        if (requestUpdateError) {
          console.error('Error updating payment requests:', requestUpdateError);
        }
      }
      
      // 3. Update previously paused payment schedules to pending status
      const { error: scheduleStatusUpdateError } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'pending',
          payment_request_id: null, // Clear payment_request_id for those that were sent
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', plan.id)
        .eq('status', 'paused');
        
      if (scheduleStatusUpdateError) throw scheduleStatusUpdateError;

      // 4. Call the database function to reschedule payments
      // Format date as YYYY-MM-DD
      const formattedDate = effectiveResumeDate.toISOString().split('T')[0]; 
      
      // Call the resume_payment_plan RPC function
      const { data: schedulingResult, error: schedulingError } = await supabase
        .rpc('resume_payment_plan', { 
          plan_id: plan.id,
          resume_date: formattedDate
        });
      
      if (schedulingError) {
        console.error('Error rescheduling payments:', schedulingError);
      } else {
        console.log('Rescheduling result:', schedulingResult);
      }

      // 5. Check if any payments should be marked as overdue now
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const { data: potentialOverduePayments, error: overdueCheckError } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', plan.id)
        .eq('status', 'pending')
        .lt('due_date', todayStr);
      
      if (!overdueCheckError && potentialOverduePayments && potentialOverduePayments.length > 0) {
        // There are payments that should be marked as overdue
        console.log(`Found ${potentialOverduePayments.length} payments that are now overdue`);
        
        // Update these payments to overdue status
        const { error: markOverdueError } = await supabase
          .from('payment_schedule')
          .update({ 
            status: 'overdue',
            updated_at: new Date().toISOString()
          })
          .in('id', potentialOverduePayments.map(p => p.id));
          
        if (markOverdueError) {
          console.error('Error marking payments as overdue:', markOverdueError);
        } else if (potentialOverduePayments.length > 0) {
          // Also update plan status if there are overdue payments
          const { error: updatePlanStatusError } = await supabase
            .from('plans')
            .update({ 
              status: 'overdue',
              has_overdue_payments: true
            })
            .eq('id', plan.id);
          
          if (updatePlanStatusError) {
            console.error('Error updating plan to overdue status:', updatePlanStatusError);
          }
        }
      }
      
      // 6. Add an activity log entry with detailed information
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          plan_id: plan.id,
          action_type: 'resume_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: 'paused',
            new_status: newStatus,
            resume_date: effectiveResumeDate.toISOString(),
            installments_affected: (pausedSchedules?.length || 0),
            sent_payments_reset: sentPaymentsCount,
            overdue_payments_found: potentialOverduePayments?.length || 0,
            days_shifted: schedulingResult ? 
              (typeof schedulingResult === 'object' && 'days_shifted' in schedulingResult ? 
                schedulingResult.days_shifted : 0) : 0
          }
        });
      
      if (activityError) {
        console.error('Error logging resume activity:', activityError);
      }
      
      toast.success('Payment plan resumed successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error resuming plan:', error);
      toast.error('Failed to resume plan: ' + error.message);
      return false;
    }
  }
  
  /**
   * Reschedule a payment plan with a new start date
   */
  static async reschedulePlan(plan: Plan, newStartDate: Date): Promise<boolean> {
    try {
      // Format date as YYYY-MM-DD for the database
      const formattedDate = newStartDate.toISOString().split('T')[0];
      console.log('Rescheduling plan with formatted date:', formattedDate);
      
      // Get the current plan to calculate days difference
      const { data: currentPlan, error: planError } = await supabase
        .from('plans')
        .select('start_date')
        .eq('id', plan.id)
        .single();
      
      if (planError) throw planError;
      
      // Calculate the difference in days between the old and new start dates
      const oldStartDate = new Date(currentPlan.start_date);
      const diffTime = newStartDate.getTime() - oldStartDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log('Shifting all pending payments by', diffDays, 'days');
      
      // Track how many payment requests we need to cancel
      let sentPaymentsCount = 0;
      const paymentRequestIds = [];
      
      // 1. Check for the appropriate status based on payment history
      const newStatus = await determinePlanStatus(plan.id);
      console.log('Determined plan status after rescheduling:', newStatus);
      
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ 
          start_date: formattedDate,
          status: newStatus,  // Use the determined status instead of hardcoding to 'active'
          has_overdue_payments: newStatus === 'overdue' // Set overdue flag based on status
        })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Get the current payment schedules - only get schedules that can be modified
      const { data: schedules, error: schedulesError } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('plan_id', plan.id)
        .in('status', getModifiableStatuses());
        
      if (schedulesError) throw schedulesError;
      
      // Process sent payments first - we need to cancel payment requests and reset status
      for (const schedule of schedules || []) {
        if (schedule.status === 'sent' && schedule.payment_request_id) {
          sentPaymentsCount++;
          paymentRequestIds.push(schedule.payment_request_id);
        }
      }
      
      // Cancel any payment requests for sent payments
      if (paymentRequestIds.length > 0) {
        const { error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('id', paymentRequestIds)
          .is('payment_id', null); // Only update requests that don't have a payment (not paid)
          
        if (requestUpdateError) {
          console.error('Error canceling payment requests:', requestUpdateError);
          // Continue execution even if this fails
        }
      }
      
      // Count how many overdue payments we reset
      let overduePaymentsCount = 0;
      
      // Update each payment schedule
      for (const schedule of schedules || []) {
        const currentDueDate = new Date(schedule.due_date);
        const newDueDate = new Date(currentDueDate);
        newDueDate.setDate(currentDueDate.getDate() + diffDays);
        
        const formattedDueDate = newDueDate.toISOString().split('T')[0];
        
        const updateData: any = { 
          due_date: formattedDueDate
        };
        
        // Reset status to pending for sent or overdue payments
        if (schedule.status === 'sent' || schedule.status === 'overdue') {
          updateData.status = 'pending';
          
          if (schedule.status === 'overdue') {
            overduePaymentsCount++;
          }
          
          if (schedule.status === 'sent') {
            updateData.payment_request_id = null;
          }
        }
        
        const { error: updateError } = await supabase
          .from('payment_schedule')
          .update(updateData)
          .eq('id', schedule.id);
          
        if (updateError) {
          console.error('Error updating schedule:', updateError);
          throw updateError;
        }
      }
      
      // 3. Add an activity log entry with enhanced details
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          plan_id: plan.id,
          action_type: 'reschedule_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: plan.status,
            was_overdue: plan.status === 'overdue',
            new_status: newStatus,
            new_start_date: formattedDate,
            days_shifted: diffDays,
            affected_payments: schedules?.length || 0,
            sent_payments_reset: sentPaymentsCount,
            overdue_payments_reset: overduePaymentsCount
          }
        });
      
      if (activityError) {
        console.error('Error logging reschedule activity:', activityError);
      }
      
      toast.success('Payment plan rescheduled successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error rescheduling plan:', error);
      toast.error('Failed to reschedule plan: ' + error.message);
      return false;
    }
  }
}
