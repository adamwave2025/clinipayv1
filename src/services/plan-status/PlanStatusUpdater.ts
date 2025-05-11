
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { PlanStatusCore } from './PlanStatusCore';
import { PlanPaymentMetrics } from './PlanPaymentMetrics';
import { PlanOverdueChecker } from './PlanOverdueChecker';

/**
 * Service for handling plan status update operations
 */
export class PlanStatusUpdater {
  /**
   * Updates the overdue status of a plan by checking for overdue payments
   * This method can be used to ensure consistency with the update-plan-statuses function
   * 
   * UPDATED: Removed dependency on has_overdue_payments flag and always updates status based on current payments
   */
  static async updatePlanOverdueStatus(planId: string): Promise<{
    success: boolean;
    status?: Plan['status'];
    error?: any;
  }> {
    try {
      // First, get the current plan data
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('status')
        .eq('id', planId)
        .single();
        
      if (planError) throw planError;
      
      // Check for overdue payments using the updated logic that includes already overdue payments
      const hasOverduePayments = await PlanOverdueChecker.checkPlanForOverduePayments(planId);
      
      // Determine the new status
      let newStatus: Plan['status'] = planData.status as Plan['status'];
      
      // If plan has overdue payments, it should be marked as overdue (unless paused/cancelled)
      if (hasOverduePayments && planData.status !== 'paused' && planData.status !== 'cancelled') {
        newStatus = 'overdue';
      }
      // If no overdue payments but status is overdue, revert to active/pending
      else if (!hasOverduePayments && planData.status === 'overdue') {
        // Determine if we should go to active or pending
        const paidCount = await PlanPaymentMetrics.getAccuratePaidInstallmentCount(planId);
        newStatus = paidCount > 0 ? 'active' : 'pending';
      }
      
      // Only update if status needs to change
      if (newStatus !== planData.status) {
        console.log(`PlanStatusUpdater.updatePlanOverdueStatus: Updating plan ${planId} - 
          Old status: ${planData.status},
          New status: ${newStatus}`);
        
        // Update the plan status
        const { error: updateError } = await supabase
          .from('plans')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', planId);
          
        if (updateError) throw updateError;
        
        return {
          success: true,
          status: newStatus
        };
      }
      
      // Nothing changed, return current values
      return {
        success: true,
        status: planData.status as Plan['status']
      };
    } catch (error) {
      console.error('Error updating plan overdue status:', error);
      return { success: false, error };
    }
  }

  /**
   * This is a legacy method that exists for backward compatibility.
   * It now refreshes the plan status from the database and updates metrics.
   */
  static async updatePlanStatus(planId: string): Promise<{success: boolean, status?: Plan['status'], error?: any}> {
    try {
      // First update the payment metrics
      await PlanPaymentMetrics.updatePlanPaymentMetrics(planId);
      
      // Then refresh the status
      return PlanStatusCore.refreshPlanStatus(planId);
    } catch (error) {
      console.error('Error updating plan status:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Legacy method for backward compatibility
   */
  static async calculatePlanStatus(planId: string): Promise<Plan['status']> {
    try {
      const result = await PlanStatusCore.refreshPlanStatus(planId);
      return result.status || 'pending';
    } catch (error) {
      console.error('Error calculating plan status:', error);
      return 'pending';
    }
  }
}
