
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';

/**
 * Service for managing plan status calculations and validations.
 * 
 * NOTE: The plan status lifecycle is now managed as follows:
 * - Manual operations (pause/resume/reschedule/cancel) explicitly set status
 * - Payment webhooks update status on payment (overdue -> active, final payment -> completed)
 * - The update-plan-statuses cron job ONLY handles setting overdue status
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
   * Calculate an accurate count of paid installments for a plan by counting
   * directly from the payment_schedule table.
   * This ensures an accurate count even if webhook duplicates occur.
   */
  static async getAccuratePaidInstallmentCount(planId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('payment_schedule')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', planId)
        .eq('status', 'paid');
        
      if (error) {
        console.error('Error counting paid installments:', error);
        return 0;
      }
      
      return count || 0;
    } catch (err) {
      console.error('Exception counting paid installments:', err);
      return 0;
    }
  }
  
  /**
   * Calculate accurate progress percentage based on paid vs total installments
   */
  static calculateProgress(paidInstallments: number, totalInstallments: number): number {
    if (!totalInstallments || totalInstallments <= 0) return 0;
    
    // Ensure progress doesn't exceed 100%
    const progress = Math.floor((paidInstallments / totalInstallments) * 100);
    return Math.min(progress, 100);
  }
  
  /**
   * Updates a plan's payment metrics with accurate counts
   * This should be used after payments are processed or status changes occur
   */
  static async updatePlanPaymentMetrics(planId: string): Promise<{success: boolean, error?: any}> {
    try {
      // Get the current plan data
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('total_installments')
        .eq('id', planId)
        .single();
        
      if (planError) throw planError;
      
      // Count actual paid installments
      const paidInstallments = await this.getAccuratePaidInstallmentCount(planId);
      
      // Calculate progress
      const progress = this.calculateProgress(paidInstallments, plan.total_installments);
      
      // Update the plan
      const { error: updateError } = await supabase
        .from('plans')
        .update({
          paid_installments: paidInstallments,
          progress: progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);
        
      if (updateError) throw updateError;
      
      return { success: true };
    } catch (error) {
      console.error('Error updating plan payment metrics:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Trigger the status update manually for a specific plan
   * This calls the update-plan-statuses edge function for a single plan
   * Note: This will now ONLY update the overdue status, not other statuses
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
   * It now refreshes the plan status from the database and updates metrics.
   */
  static async updatePlanStatus(planId: string): Promise<{success: boolean, status?: Plan['status'], error?: any}> {
    try {
      // First update the payment metrics
      await this.updatePlanPaymentMetrics(planId);
      
      // Then refresh the status
      return this.refreshPlanStatus(planId);
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
      const result = await this.refreshPlanStatus(planId);
      return result.status || 'pending';
    } catch (error) {
      console.error('Error calculating plan status:', error);
      return 'pending';
    }
  }
}
