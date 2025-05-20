
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CompleteResumePlanResponse } from '@/types/supabaseRpcTypes';

/**
 * Service for handling plan resume operations
 */
export class PlanResumeService {
  /**
   * Resume a paused plan
   * @param plan The plan to resume
   * @param resumeDate Optional date to resume the plan (defaults to today)
   * @returns Promise<boolean> indicating success or failure
   */
  static async resumePlan(plan: Plan, resumeDate?: Date): Promise<boolean> {
    try {
      // Default to today if no date is specified
      const today = new Date();
      
      const dateToUse = resumeDate || today;
      
      // Use date-fns format to ensure correct date preservation for UK timezone
      const formattedDate = format(dateToUse, 'yyyy-MM-dd');
      
      console.log(`Resuming plan ${plan.id} with date:`, formattedDate);
      
      // First check if plan has any paid payments to determine the correct status
      const { data: paidPayments, error: countError } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', plan.id)
        .eq('status', 'paid');

      if (countError) {
        console.error('Error checking paid payments:', countError);
        // Continue with the operation even if this check fails
      }

      const hasPaidPayments = paidPayments && paidPayments.length > 0;
      console.log(`Plan has paid payments: ${hasPaidPayments ? 'YES' : 'NO'}`);
      
      // Call our complete_resume_plan database function
      // Note: The function doesn't accept p_target_status parameter so we remove it
      const { data, error } = await supabase.rpc('complete_resume_plan', {
        p_plan_id: plan.id,
        p_resume_date: formattedDate
      });
      
      if (error) {
        console.error('Error calling complete_resume_plan:', error);
        throw new Error(`Failed to resume plan: ${error.message}`);
      }
      
      // First convert data to unknown, then to our expected type to avoid type errors
      const result = data as unknown as CompleteResumePlanResponse;
      
      if (!result || !result.success) {
        const errorMessage = result?.error || 'Unknown error resuming plan';
        console.error('Resume plan operation failed:', result);
        throw new Error(errorMessage);
      }
      
      console.log('Plan resumed successfully:', result);
      
      // Create an activity log entry for the plan resumption
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          clinic_id: plan.clinicId,
          patient_id: plan.patientId,
          plan_id: plan.id,
          payment_link_id: plan.paymentLinkId,
          action_type: 'plan_resumed',
          details: {
            planName: plan.title || plan.planName,
            resumeDate: formattedDate,
            nextDueDate: formattedDate
          }
        });
      
      if (activityError) {
        console.warn('Error creating activity log for plan resume:', activityError);
        // Continue even if activity log fails
      }
      
      return true;
    } catch (error) {
      console.error('Error in resumePlan:', error);
      return false;
    }
  }
}
