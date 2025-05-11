
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for detecting and managing overdue payments
 */
export class PlanOverdueChecker {
  /**
   * Checks if a plan has overdue payments
   * This function uses the same logic as the update-plan-statuses edge function
   * to ensure consistency across all code paths
   * 
   * UPDATED: Now also considers already overdue payments in the check
   */
  static async checkPlanForOverduePayments(planId: string): Promise<boolean> {
    try {
      // Get current date in YYYY-MM-DD format for overdue check
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Check if any payment is past its due date and not paid/cancelled/paused
      // CRITICAL FIX: Now we include 'overdue' in the status check to also find already overdue payments
      const { data, error } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', planId)
        .in('status', ['pending', 'sent', 'overdue'])
        .lt('due_date', todayStr)
        .limit(1);
        
      if (error) throw error;
      
      const hasOverdue = data && data.length > 0;
      console.log(`PlanOverdueChecker.checkPlanForOverduePayments: Plan ${planId} has ${hasOverdue ? '' : 'no '}overdue payments`);
      return hasOverdue;
    } catch (error) {
      console.error(`Error checking for overdue payments in plan ${planId}:`, error);
      return false;
    }
  }

  /**
   * Trigger the status update manually for a specific plan
   * This calls the update-plan-statuses edge function for a single plan
   * Note: This will now ONLY update the overdue status, not other statuses
   */
  static async triggerStatusUpdate(planId: string): Promise<{success: boolean, status?: any, error?: any}> {
    try {
      // Call the edge function to update the plan status
      const { data, error } = await supabase.functions.invoke('update-plan-statuses', {
        body: JSON.stringify({ planId })
      });
      
      if (error) throw error;
      
      return {
        success: true,
        status: data
      };
    } catch (error) {
      console.error('Error triggering plan status update:', error);
      return { success: false, error };
    }
  }
}
