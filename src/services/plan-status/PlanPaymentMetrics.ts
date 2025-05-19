import { supabase } from '@/integrations/supabase/client';

/**
 * Service for handling plan payment metrics calculations
 */
export class PlanPaymentMetrics {
  /**
   * Calculate an accurate count of paid installments for a plan by counting
   * directly from the payment_schedule table.
   * This ensures an accurate count even if webhook duplicates occur.
   * 
   * UPDATED: Now also includes refunded and partially refunded payments as paid
   */
  static async getAccuratePaidInstallmentCount(planId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('payment_schedule')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', planId)
        .in('status', ['paid', 'refunded', 'partially_refunded']);
        
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
   * Logs a payment activity in the payment_activity table
   */
  static async logPaymentActivity(
    paymentLinkId: string,
    patientId: string,
    clinicId: string,
    planId: string,
    actionType: string,
    details: Record<string, any>
  ): Promise<{success: boolean, error?: any}> {
    try {
      const { error } = await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: paymentLinkId,
          patient_id: patientId,
          clinic_id: clinicId,
          plan_id: planId,
          action_type: actionType,
          performed_at: new Date().toISOString(),
          details
        });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error logging payment activity:', error);
      return { success: false, error };
    }
  }
}
