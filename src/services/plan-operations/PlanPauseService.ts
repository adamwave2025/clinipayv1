
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { getModifiableStatuses } from '@/utils/paymentStatusUtils';

/**
 * Service for handling plan pause operations
 */
export class PlanPauseService {
  /**
   * Pause a payment plan
   * @param plan The plan to pause
   * @returns boolean indicating success or failure
   */
  static async pausePlan(plan: Plan): Promise<boolean> {
    try {
      console.log(`Starting pause operation for plan: ${plan.id} (${plan.title || plan.planName})`);
    
      // Get the current plan to ensure it exists
      const { data: planData, error: planFetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan.id)
        .single();
        
      if (planFetchError) {
        console.error('Error fetching plan data:', planFetchError);
        throw planFetchError;
      }
      
      // Find payment requests that need to be cancelled
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('payment_schedule')
        .select('id, payment_request_id, status')
        .eq('plan_id', plan.id)
        .in('status', ['pending', 'sent', 'overdue'])
        .not('payment_request_id', 'is', null);
        
      if (scheduleError) {
        console.error('Error fetching payment schedules:', scheduleError);
        throw scheduleError;
      }
      
      console.log(`Found ${scheduleData?.length || 0} payment schedules with request IDs`);
      
      // Extract payment request IDs
      const paymentRequestIds = scheduleData
        ?.filter(item => item.payment_request_id)
        .map(item => item.payment_request_id) || [];
        
      console.log(`Identified ${paymentRequestIds.length} payment requests to cancel:`, paymentRequestIds);
      
      // Cancel payment requests first - CRITICAL CHANGE: Remove the is('payment_id', null) condition
      if (paymentRequestIds.length > 0) {
        const { data: updatedRequests, error: requestCancelError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled'
            // Removed updated_at as it doesn't exist in the table
          })
          .in('id', paymentRequestIds)
          // No condition here for payment_id
          .select();
          
        if (requestCancelError) {
          console.error('Error cancelling payment requests:', requestCancelError);
          // No longer just a warning - throw the error to stop the operation
          throw new Error(`Failed to cancel payment requests: ${requestCancelError.message}`);
        } else {
          console.log(`Successfully cancelled ${updatedRequests?.length || 0} payment requests:`, 
            updatedRequests?.map(r => r.id));
        }
      }
      
      // After successfully cancelling requests, update payment schedules
      const { data: updatedSchedules, error: updateScheduleError } = await supabase
        .from('payment_schedule')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', plan.id)
        .in('status', ['pending', 'scheduled', 'sent', 'overdue'])
        .select();
        
      if (updateScheduleError) {
        console.error('Error updating payment schedules:', updateScheduleError);
        throw updateScheduleError;
      }
      
      console.log(`Successfully paused ${updatedSchedules?.length || 0} payment schedules`);
      
      // After payment schedules are updated, update the plan status
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id);
        
      if (planUpdateError) {
        console.error('Error updating plan status:', planUpdateError);
        throw planUpdateError;
      }
      
      // Record the activity
      await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          plan_id: plan.id,
          action_type: 'plan_paused',
          details: {
            paused_at: new Date().toISOString(),
            payment_requests_cancelled: paymentRequestIds.length
          }
        });
      
      console.log('Plan paused successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error pausing payment plan:', error);
      return false;
    }
  }
}
