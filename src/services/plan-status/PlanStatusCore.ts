
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Core functionality for plan status checking and validation
 */
export class PlanStatusCore {
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
}
