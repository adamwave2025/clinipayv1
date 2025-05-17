/**
 * Response from the complete_resume_plan RPC function
 */
export interface CompleteResumePlanResponse {
  success: boolean;
  error?: string;
  updated_plan_id?: string;
  updated_plan_status?: string;
  total_updated_schedules?: number;
}
