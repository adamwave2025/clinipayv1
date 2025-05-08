
import { supabase } from '@/integrations/supabase/client';
import { isPaymentStatusTransitionValid } from './paymentStatusUtils';
import { Plan } from '@/utils/planTypes';

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
  if (!plan) return false;
  return plan.status === 'paused';
};

/**
 * Check if a plan is currently active
 */
export const isPlanActive = (plan: Plan | null): boolean => {
  if (!plan) return false;
  return plan.status === 'active' || plan.status === 'overdue';
};

/**
 * Check if a plan is cancelled or completed
 */
export const isPlanFinished = (plan: Plan | null): boolean => {
  if (!plan) return false;
  return plan.status === 'cancelled' || plan.status === 'completed';
};

/**
 * Determine the appropriate plan status based on the payment status
 * When resuming a plan, this ensures we set the correct status
 */
export const determinePlanStatus = async (planId: string): Promise<string> => {
  try {
    // First check if there are any paid payments
    const { data: paidPayments, error: paidError } = await supabase
      .from('payment_schedule')
      .select('id')
      .eq('plan_id', planId)
      .eq('status', 'paid')
      .limit(1);
      
    if (paidError) throw paidError;
    
    // If there are paid payments, plan should be active (unless it has overdue payments)
    if (paidPayments && paidPayments.length > 0) {
      // Check for overdue payments
      const { data: overduePayments, error: overdueError } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', planId)
        .eq('status', 'overdue')
        .limit(1);
        
      if (overdueError) throw overdueError;
      
      if (overduePayments && overduePayments.length > 0) {
        return 'overdue';
      }
      
      return 'active';
    }
    
    // If no paid payments, plan should be pending
    return 'pending';
  } catch (error) {
    console.error('Error determining plan status:', error);
    return 'pending'; // Default to pending if we can't determine status
  }
};
