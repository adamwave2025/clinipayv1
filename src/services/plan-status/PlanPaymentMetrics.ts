
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for handling plan payment metrics calculations
 */
export class PlanPaymentMetrics {
  /**
   * Calculate an accurate count of paid installments for a plan by counting
   * directly from the payment_schedule table.
   * This ensures an accurate count even if webhook duplicates occur.
   */
  static async getAccuratePaidInstallmentCount(planId: string): Promise<number> {
    try {
      console.log(`Counting paid installments for plan ${planId}`);
      
      const { count, error, data } = await supabase
        .from('payment_schedule')
        .select('id, status', { count: 'exact' })
        .eq('plan_id', planId)
        .eq('status', 'paid');
        
      if (error) {
        console.error('Error counting paid installments:', error);
        return 0;
      }
      
      // Log what we found for debugging
      console.log(`Found ${count} paid installments for plan ${planId}`);
      if (data && data.length > 0) {
        console.log('Paid installments:', data.map(item => item.id));
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
    
    // Log the calculation for debugging
    console.log(`Calculating progress: ${paidInstallments}/${totalInstallments} = ${progress}%`);
    
    return Math.min(progress, 100);
  }
  
  /**
   * Updates a plan's payment metrics with accurate counts
   * This should be used after payments are processed or status changes occur
   */
  static async updatePlanPaymentMetrics(planId: string): Promise<{success: boolean, error?: any}> {
    try {
      console.log(`Updating payment metrics for plan ${planId}`);
      
      // Get the current plan data
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('total_installments, paid_installments, progress')
        .eq('id', planId)
        .single();
        
      if (planError) {
        console.error('Error fetching plan data:', planError);
        throw planError;
      }
      
      console.log('Current plan metrics:', {
        total_installments: plan.total_installments,
        paid_installments: plan.paid_installments,
        progress: plan.progress
      });
      
      // Count actual paid installments
      const paidInstallments = await this.getAccuratePaidInstallmentCount(planId);
      
      // Calculate progress
      const progress = this.calculateProgress(paidInstallments, plan.total_installments);
      
      console.log('New plan metrics to update:', {
        paid_installments: paidInstallments,
        progress: progress
      });
      
      // Update the plan
      const { error: updateError } = await supabase
        .from('plans')
        .update({
          paid_installments: paidInstallments,
          progress: progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);
        
      if (updateError) {
        console.error('Error updating plan metrics:', updateError);
        throw updateError;
      }
      
      console.log(`Successfully updated plan ${planId} metrics: ${paidInstallments}/${plan.total_installments} (${progress}%)`);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating plan payment metrics:', error);
      return { success: false, error };
    }
  }
}
