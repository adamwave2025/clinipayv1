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
 * Determine the appropriate plan status based on the payment status and plan history
 * This implements the business rules for plan status following the priority order:
 * 1. cancelled (highest priority)
 * 2. paused
 * 3. completed
 * 4. overdue
 * 5. active
 * 6. pending (lowest priority)
 * 
 * @param planId The ID of the plan to determine status for
 * @returns The determined plan status following business rules
 */
export const determinePlanStatus = async (planId: string): Promise<Plan['status']> => {
  try {
    // Step 1: Get the plan record with essential information to check for manual override statuses
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('status, total_installments')
      .eq('id', planId)
      .single();
      
    if (planError) throw planError;
    
    // Priority 1: Check for manually set override statuses first (highest priority)
    if (plan.status === 'cancelled') {
      console.log(`Plan ${planId} status determined as: cancelled (manual override)`);
      return 'cancelled';
    }
    
    if (plan.status === 'paused') {
      console.log(`Plan ${planId} status determined as: paused (manual override)`);
      return 'paused';
    }
    
    // Step 2: Check if the plan is completed by comparing paid installments to total
    const { count: paidCount, error: paidError } = await supabase
      .from('payment_schedule')
      .select('id', { count: 'exact', head: false })
      .eq('plan_id', planId)
      .eq('status', 'paid');
      
    if (paidError) throw paidError;
    
    if (paidCount >= plan.total_installments) {
      console.log(`Plan ${planId} status determined as: completed (all payments made: ${paidCount}/${plan.total_installments})`);
      return 'completed';
    }
    
    // Step 3: Check for overdue payments (only if not cancelled, paused or completed)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const { data: overduePayments, error: overdueError } = await supabase
      .from('payment_schedule')
      .select('id')
      .eq('plan_id', planId)
      .not('status', 'in', ['paid', 'cancelled', 'paused'])
      .lt('due_date', todayStr)
      .limit(1);
      
    if (overdueError) throw overdueError;
    
    if (overduePayments && overduePayments.length > 0) {
      console.log(`Plan ${planId} status determined as: overdue (has ${overduePayments.length} overdue payments)`);
      return 'overdue';
    }
    
    // Step 4: Check for any paid payments to determine active vs pending
    const { data: paidPayments, error: paidQueryError } = await supabase
      .from('payment_schedule')
      .select('id')
      .eq('plan_id', planId)
      .eq('status', 'paid')
      .limit(1);
      
    if (paidQueryError) throw paidQueryError;
    
    if (paidPayments && paidPayments.length > 0) {
      console.log(`Plan ${planId} status determined as: active (has at least one paid payment)`);
      return 'active'; // Plan becomes active after first payment
    }
    
    // Step 5: Default to pending if none of the above conditions are met
    console.log(`Plan ${planId} status determined as: pending (no payments made yet)`);
    return 'pending';
  } catch (error) {
    console.error('Error determining plan status:', error);
    return 'pending'; // Default to pending on error
  }
};

/**
 * Validate that a status string is one of the valid plan statuses
 * This ensures type safety when working with statuses from the database
 */
export const validatePlanStatus = (status: string): Plan['status'] => {
  // Create array of valid statuses matching our Plan type
  const validStatuses: Plan['status'][] = ['active', 'pending', 'completed', 'overdue', 'cancelled', 'paused'];
  
  // Check if the provided status is valid
  if (validStatuses.includes(status as Plan['status'])) {
    return status as Plan['status'];
  }
  
  // Return a default value if invalid
  console.warn(`Invalid plan status received from database: ${status}. Defaulting to 'pending'.`);
  return 'pending';
};
