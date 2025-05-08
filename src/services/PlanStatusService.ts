
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
import { toast } from 'sonner';

/**
 * Plan Status State Machine
 * 
 * The possible states for a payment plan are:
 * 
 * - pending: No payments have been made yet
 * - active: At least one payment has been made, no overdue payments
 * - overdue: At least one payment has been made AND has at least one overdue payment
 * - paused: Manually set, overrides automatic status calculation
 * - cancelled: Manually set, overrides automatic status calculation
 * - completed: All payments have been made
 * 
 * State transitions:
 * - pending -> active: When first payment is made
 * - pending -> paused: When plan is manually paused
 * - pending -> cancelled: When plan is manually cancelled
 * - active -> overdue: When a payment becomes overdue
 * - active -> paused: When plan is manually paused
 * - active -> cancelled: When plan is manually cancelled
 * - active -> completed: When all payments are made
 * - overdue -> active: When all overdue payments are paid
 * - overdue -> paused: When plan is manually paused
 * - overdue -> cancelled: When plan is manually cancelled
 * - overdue -> completed: When all payments are made (including overdue ones)
 * - paused -> pending: When plan is resumed and no payments made yet
 * - paused -> active: When plan is resumed and has payments
 * - paused -> overdue: When plan is resumed and has overdue payments
 */

/**
 * Service class to handle all payment plan status operations
 * This is the SINGLE SOURCE OF TRUTH for plan status
 */
export class PlanStatusService {
  /**
   * Calculate the current status for a plan based on its payments
   * This is the single source of truth for determining plan status
   * 
   * @param planId The plan ID to calculate status for
   * @returns The calculated plan status
   */
  static async calculatePlanStatus(planId: string): Promise<Plan['status']> {
    try {
      // Step 1: Get the plan record to check for manual override statuses
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('status, total_installments')
        .eq('id', planId)
        .single();
        
      if (planError) {
        console.error('Error fetching plan data:', planError);
        throw planError;
      }
      
      // Priority 1: Check for manually set statuses that override everything else
      if (plan.status === 'cancelled' || plan.status === 'paused') {
        console.log(`Plan ${planId} status is ${plan.status} (manual override)`);
        return plan.status;
      }
      
      // Step 2: Check if the plan is completed by comparing paid installments to total
      const { count: paidCount, error: paidError } = await supabase
        .from('payment_schedule')
        .select('id', { count: 'exact', head: false })
        .eq('plan_id', planId)
        .eq('status', 'paid');
        
      if (paidError) {
        console.error('Error counting paid payments:', paidError);
        throw paidError;
      }
      
      // If all payments are paid, the plan is completed
      if (paidCount >= plan.total_installments) {
        console.log(`Plan ${planId} status determined as: completed (all payments made: ${paidCount}/${plan.total_installments})`);
        return 'completed';
      }
      
      // Step 3: Check for overdue payments
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const { data: overduePayments, error: overdueError } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', planId)
        .not('status', 'in', ['paid', 'cancelled', 'paused'])
        .lt('due_date', todayStr)
        .limit(1);
        
      if (overdueError) {
        console.error('Error checking for overdue payments:', overdueError);
        throw overdueError;
      }
      
      // If there are overdue payments AND at least one payment has been made,
      // then the plan is overdue
      if (overduePayments && overduePayments.length > 0 && paidCount > 0) {
        console.log(`Plan ${planId} status determined as: overdue (has ${overduePayments.length} overdue payments)`);
        return 'overdue';
      }
      
      // Step 4: Determine active vs pending based on payment history
      if (paidCount > 0) {
        console.log(`Plan ${planId} status determined as: active (has ${paidCount} paid payments)`);
        return 'active';
      } else {
        console.log(`Plan ${planId} status determined as: pending (no payments made yet)`);
        return 'pending';
      }
    } catch (error) {
      console.error('Error calculating plan status:', error);
      // Default to pending on error for safety
      return 'pending';
    }
  }

  /**
   * Update the status of a plan in the database based on calculated status
   * 
   * @param planId The plan ID to update
   * @returns Success status and updated plan
   */
  static async updatePlanStatus(planId: string): Promise<{ 
    success: boolean;
    status?: Plan['status'];
    error?: any;
  }> {
    try {
      // Calculate the correct status
      const calculatedStatus = await this.calculatePlanStatus(planId);
      
      // Get current plan status to check if it needs updating
      const { data: currentPlan, error: currentPlanError } = await supabase
        .from('plans')
        .select('status, has_overdue_payments')
        .eq('id', planId)
        .single();
        
      if (currentPlanError) {
        throw currentPlanError;
      }
      
      // Only update if the status has changed
      if (currentPlan.status !== calculatedStatus) {
        console.log(`Updating plan ${planId} status from ${currentPlan.status} to ${calculatedStatus}`);
        
        // Update the plan status and has_overdue_payments flag
        const { error: updateError } = await supabase
          .from('plans')
          .update({ 
            status: calculatedStatus,
            has_overdue_payments: calculatedStatus === 'overdue'
          })
          .eq('id', planId);
          
        if (updateError) {
          throw updateError;
        }
        
        // Log the status change to the payment_activity table
        await supabase
          .from('payment_activity')
          .insert({
            payment_link_id: null, // Will be filled in by the database trigger
            patient_id: null, // Will be filled in by the database trigger
            clinic_id: null, // Will be filled in by the database trigger
            plan_id: planId,
            action_type: 'update_status',
            details: {
              previous_status: currentPlan.status,
              new_status: calculatedStatus,
              automatic: true
            }
          });
      } else {
        console.log(`Plan ${planId} status remains ${calculatedStatus} (no change needed)`);
      }
      
      return { 
        success: true, 
        status: calculatedStatus
      };
    } catch (error) {
      console.error('Error updating plan status:', error);
      return { 
        success: false, 
        error
      };
    }
  }

  /**
   * Handle a payment status change and update the plan status accordingly
   * This should be called whenever a payment status changes
   * 
   * @param paymentId Payment ID that changed
   * @param planId Plan ID to update
   * @param newPaymentStatus New status of the payment
   */
  static async handlePaymentStatusChange(
    paymentId: string, 
    planId: string, 
    newPaymentStatus: string
  ): Promise<void> {
    try {
      console.log(`Payment ${paymentId} status changed to ${newPaymentStatus}, updating plan ${planId} status`);
      
      // Update the plan status based on its payments
      await this.updatePlanStatus(planId);
    } catch (error) {
      console.error('Error handling payment status change:', error);
      toast.error('Failed to update plan status after payment change');
    }
  }
  
  /**
   * Check if a plan is currently paused
   */
  static isPlanPaused(plan: Plan | null): boolean {
    if (!plan) return false;
    return plan.status === 'paused';
  }

  /**
   * Check if a plan is currently active or overdue
   * Both these statuses indicate the plan is in progress
   */
  static isPlanActive(plan: Plan | null): boolean {
    if (!plan) return false;
    return plan.status === 'active' || plan.status === 'overdue';
  }

  /**
   * Check if a plan is cancelled or completed
   * Both these statuses indicate the plan is finished
   */
  static isPlanFinished(plan: Plan | null): boolean {
    if (!plan) return false;
    return plan.status === 'cancelled' || plan.status === 'completed';
  }

  /**
   * Check if a plan is pending
   * This indicates the plan has not started yet (no payments made)
   */
  static isPlanPending(plan: Plan | null): boolean {
    if (!plan) return false;
    return plan.status === 'pending';
  }

  /**
   * Validate that a status string is one of the valid plan statuses
   * This ensures type safety when working with statuses from the database
   */
  static validatePlanStatus(status: string): Plan['status'] {
    // Create array of valid statuses matching our Plan type
    const validStatuses: Plan['status'][] = ['active', 'pending', 'completed', 'overdue', 'cancelled', 'paused'];
    
    // Check if the provided status is valid
    if (validStatuses.includes(status as Plan['status'])) {
      return status as Plan['status'];
    }
    
    // Return a default value if invalid
    console.warn(`Invalid plan status received from database: ${status}. Defaulting to 'pending'.`);
    return 'pending';
  }
}
