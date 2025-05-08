
import { supabase } from '@/integrations/supabase/client';
import { isPaymentStatusTransitionValid } from './paymentStatusUtils';
import { Plan } from '@/utils/planTypes';
import { PlanStatusService } from '@/services/PlanStatusService';

// We're assuming this is the function with the error on line 136
export const recordPaymentOverdue = async (planId: string, details: any) => {
  try {
    // Get the plan details first to get related IDs
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('patient_id, clinic_id, payment_link_id')
      .eq('id', planId)
      .single();
    
    if (planError) throw planError;
    
    // Record activity
    const { error: activityError } = await supabase
      .from('payment_activity')
      .insert({
        patient_id: planData.patient_id,
        clinic_id: planData.clinic_id,
        payment_link_id: planData.payment_link_id,
        plan_id: planId,  // Add plan_id to the insert
        action_type: 'overdue',
        details: details
      });
    
    if (activityError) throw activityError;
    
    // Update the plan status using our PlanStatusService
    await PlanStatusService.updatePlanStatus(planId);
    
    return { success: true };
  } catch (error) {
    console.error('Error recording payment overdue:', error);
    return { success: false, error };
  }
};

/**
 * Check if a plan is currently paused
 */
export const isPlanPaused = (plan: Plan | null): boolean => {
  return PlanStatusService.isPlanPaused(plan);
};

/**
 * Check if a plan is currently active
 */
export const isPlanActive = (plan: Plan | null): boolean => {
  return PlanStatusService.isPlanActive(plan);
};

/**
 * Check if a plan is cancelled or completed
 */
export const isPlanFinished = (plan: Plan | null): boolean => {
  return PlanStatusService.isPlanFinished(plan);
};

/**
 * Determine the appropriate plan status based on the payment status and plan history
 * This now delegates to our PlanStatusService for a single source of truth
 */
export const determinePlanStatus = async (planId: string): Promise<Plan['status']> => {
  return PlanStatusService.calculatePlanStatus(planId);
};

/**
 * Validate that a status string is one of the valid plan statuses
 * This ensures type safety when working with statuses from the database
 */
export const validatePlanStatus = (status: string): Plan['status'] => {
  return PlanStatusService.validatePlanStatus(status);
};
