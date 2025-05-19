
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { getModifiableStatuses } from '@/utils/paymentStatusUtils';

/**
 * Service for handling plan cancellation operations
 */
export class PlanCancelService {
  /**
   * Cancel a payment plan
   * @param plan The plan to cancel
   * @returns boolean indicating success or failure
   */
  static async cancelPlan(plan: Plan): Promise<boolean> {
    try {
      console.log(`Cancelling plan ${plan.id} (${plan.title || plan.planName})`);
      
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
      
      // 3. Also cancel any active payment requests associated with this plan's schedules
      const { data: paymentRequests, error: requestsError } = await supabase
        .from('payment_schedule')
        .select('payment_request_id')
        .eq('plan_id', plan.id)
        .not('payment_request_id', 'is', null);
        
      if (requestsError) throw requestsError;
      
      // Extract the request IDs
      const requestIds = paymentRequests
        .map(item => item.payment_request_id)
        .filter(id => id !== null);
        
      // Update payment requests if there are any
      if (requestIds.length > 0) {
        const { error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled'
            // Removed updated_at as it doesn't exist in the table
          })
          .in('id', requestIds);
          // CRITICAL: Removed conditional is('payment_id', null) to ensure ALL requests get cancelled
          
        if (requestUpdateError) {
          console.error('Error updating payment requests:', requestUpdateError);
          // Non-critical error, continue with the operation
        }
      }
      
      // 3. Add an activity log entry
      // CHANGED: Updated action_type from 'cancel_plan' to 'plan_cancelled' for consistency
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          plan_id: plan.id, // Make sure to include plan_id for easier activity tracking
          action_type: 'plan_cancelled', // Changed from 'cancel_plan' to 'plan_cancelled'
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: plan.status
          }
        });
      
      if (activityError) {
        console.error('Error logging cancel activity:', activityError);
      }
      
      console.log('Plan cancelled successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error cancelling plan:', error);
      return false;
    }
  }
}
