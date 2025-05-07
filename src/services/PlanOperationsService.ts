
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
import { toast } from 'sonner';
import { isPaymentStatusModifiable, getModifiableStatuses } from '@/utils/paymentStatusUtils';

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
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: 'paused' })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all pending payment schedules to paused
      // Only update schedules that are in a modifiable state (not paid)
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'paused' })
        .eq('plan_id', plan.id)
        .eq('status', 'pending');
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_activity') // Fixed: Changed from payment_plan_activities to payment_activity
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          action_type: 'pause_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: plan.status
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
      
      // Determine what the plan status should be updated to
      const newStatus = plan.hasOverduePayments ? 'overdue' : 'active';
      
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: newStatus })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all paused payment schedules back to pending
      // Only update schedules that are in a paused state
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'pending' })
        .eq('plan_id', plan.id)
        .eq('status', 'paused');
        
      if (scheduleUpdateError) throw scheduleUpdateError;

      // 3. Call the database function to reschedule payments
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
      
      // 4. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_activity') // Fixed: Changed from payment_plan_activities to payment_activity
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          action_type: 'resume_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: 'paused',
            new_status: newStatus,
            resume_date: effectiveResumeDate.toISOString()
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
      
      // 1. Update the plan start date in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ start_date: formattedDate })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Since we don't have the reschedule_payment_plan RPC function yet,
      // We'll manually update the payment schedule by shifting all pending payments
      // based on the difference between the current start date and new start date
      
      // First, get the current payment schedules - only get schedules that can be modified (not paid)
      const { data: schedules, error: schedulesError } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('plan_id', plan.id)
        .in('status', getModifiableStatuses());
        
      if (schedulesError) throw schedulesError;
      
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
      
      // Update each pending payment schedule
      for (const schedule of schedules || []) {
        const currentDueDate = new Date(schedule.due_date);
        const newDueDate = new Date(currentDueDate);
        newDueDate.setDate(currentDueDate.getDate() + diffDays);
        
        const formattedDueDate = newDueDate.toISOString().split('T')[0];
        
        const { error: updateError } = await supabase
          .from('payment_schedule')
          .update({ due_date: formattedDueDate })
          .eq('id', schedule.id);
          
        if (updateError) {
          console.error('Error updating schedule:', updateError);
          throw updateError;
        }
      }
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_activity') // Fixed: Changed from payment_plan_activities to payment_activity
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          action_type: 'reschedule_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: plan.status,
            new_start_date: formattedDate
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
