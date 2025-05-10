
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';

/**
 * Service for managing plan status calculations and validations.
 * Note: The primary source of truth for a plan's status is now the update-plan-statuses
 * cron job, which calculates status based on payment_schedule entries.
 */
export class PlanStatusService {
  /**
   * Check if a plan is currently paused
   */
  static isPlanPaused(plan: Plan | null): boolean {
    if (!plan) return false;
    return plan.status === 'paused';
  }
  
  /**
   * Check if a plan is currently active
   */
  static isPlanActive(plan: Plan | null): boolean {
    if (!plan) return false;
    return ['active', 'pending', 'overdue'].includes(plan.status);
  }
  
  /**
   * Check if a plan is finished (cancelled or completed)
   */
  static isPlanFinished(plan: Plan | null): boolean {
    if (!plan) return false;
    return ['cancelled', 'completed'].includes(plan.status);
  }
  
  /**
   * Validate that a status string is one of the valid plan statuses
   */
  static validatePlanStatus(status: string): Plan['status'] {
    const validStatuses = ['active', 'pending', 'paused', 'cancelled', 'completed', 'overdue'];
    
    if (validStatuses.includes(status)) {
      return status as Plan['status'];
    }
    
    // Default to 'pending' if invalid status is provided
    console.warn(`Invalid plan status: ${status}, defaulting to 'pending'`);
    return 'pending';
  }
  
  /**
   * Refreshes a plan's status from the database
   * This is useful after operations like pausing or resuming a plan
   */
  static async refreshPlanStatus(planId: string): Promise<{success: boolean, status?: Plan['status'], error?: any}> {
    try {
      // Get the plan's current status from the database
      const { data: plan, error } = await supabase
        .from('plans')
        .select('status')
        .eq('id', planId)
        .single();
        
      if (error) throw error;
      
      // Validate the status
      const validStatus = this.validatePlanStatus(plan.status);
      
      return { 
        success: true, 
        status: validStatus
      };
    } catch (error) {
      console.error('Error refreshing plan status:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Trigger the status update manually for a specific plan
   * This calls the update-plan-statuses edge function for a single plan
   */
  static async triggerStatusUpdate(planId: string): Promise<{success: boolean, status?: Plan['status'], error?: any}> {
    try {
      // Call the edge function to update the plan status
      const { data, error } = await supabase.functions.invoke('update-plan-statuses', {
        body: JSON.stringify({ planId })
      });
      
      if (error) throw error;
      
      // Get the updated plan status
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('status')
        .eq('id', planId)
        .single();
        
      if (planError) throw planError;
      
      // Validate the status
      const validStatus = this.validatePlanStatus(plan.status);
      
      return {
        success: true,
        status: validStatus
      };
    } catch (error) {
      console.error('Error triggering plan status update:', error);
      return { success: false, error };
    }
  }
  
  /**
   * This is a legacy method that exists for backward compatibility.
   * It now simply refreshes the plan status from the database since
   * the actual status calculation is done by the cron job.
   */
  static async updatePlanStatus(planId: string): Promise<{success: boolean, status?: Plan['status'], error?: any}> {
    return this.refreshPlanStatus(planId);
  }
  
  /**
   * Legacy method for backward compatibility
   */
  static async calculatePlanStatus(planId: string): Promise<Plan['status']> {
    try {
      const result = await this.refreshPlanStatus(planId);
      return result.status || 'pending';
    } catch (error) {
      console.error('Error calculating plan status:', error);
      return 'pending';
    }
  }
}
