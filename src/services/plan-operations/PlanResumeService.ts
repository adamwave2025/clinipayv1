
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
   * @param resumeDate Optional date to resume the plan (defaults to tomorrow)
   * @returns Promise<boolean> indicating success or failure
   */
  static async resumePlan(plan: Plan, resumeDate?: Date): Promise<boolean> {
    try {
      // Default to tomorrow if no date is specified
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dateToUse = resumeDate || tomorrow;
      
      // Use date-fns format to ensure correct date preservation for UK timezone
      const formattedDate = format(dateToUse, 'yyyy-MM-dd');
      
      console.log(`Resuming plan ${plan.id} with date:`, formattedDate);
      
      // Call our complete_resume_plan database function
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
      return true;
    } catch (error) {
      console.error('Error in resumePlan:', error);
      return false;
    }
  }
}
