
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
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
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: 'cancelled' })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all pending payment schedules to cancelled
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'cancelled' })
        .eq('plan_id', plan.id)
        .in('status', ['pending', 'paused']);
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_plan_activities')
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
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'paused' })
        .eq('plan_id', plan.id)
        .eq('status', 'pending');
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_plan_activities')
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
  static async resumePlan(plan: Plan): Promise<boolean> {
    try {
      // Determine what the plan status should be updated to
      const newStatus = plan.hasOverduePayments ? 'overdue' : 'active';
      
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: newStatus })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all paused payment schedules back to pending
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'pending' })
        .eq('plan_id', plan.id)
        .eq('status', 'paused');
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_plan_activities')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          action_type: 'resume_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: 'paused',
            new_status: newStatus
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
}
