
/**
 * Custom type definitions to extend the auto-generated Supabase types
 * These types allow us to properly call database functions with parameters
 * that might not be reflected in the auto-generated types
 */

/**
 * Custom type for the complete_resume_plan function parameters
 */
export interface CompleteResumePlanParams {
  p_plan_id: string;
  p_resume_date: string;
}

/**
 * Custom type for the response from the complete_resume_plan function
 */
export interface CompleteResumePlanResponse {
  success: boolean;
  plan_id: string;
  resume_date: string;
  plan_status: 'active' | 'pending';
  has_paid_payments: boolean;
  days_shifted: number;
  payments_updated: number;
  debug?: Record<string, any>;
  error?: string;
  detail?: string;
}

/**
 * Custom type for the resume_payment_plan function parameters
 * This extends the auto-generated types to include the payment_status parameter
 */
export interface ResumePlanParams {
  plan_id: string;
  resume_date: string;
  payment_status: string;
}

/**
 * Custom type for the response from the resume_payment_plan function
 */
export interface ResumePlanResponse {
  success: boolean;
  days_shifted: number;
  resume_date: string;
  payments_rescheduled: number;
  status_used?: string;
  debug?: Record<string, any>;
  message?: string;
  warning?: string;
}
