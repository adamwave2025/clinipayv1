
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';

/**
 * Service for managing plan status calculations and validations
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
   * Calculate and update the correct status for a plan based on its payments
   */
  static async updatePlanStatus(planId: string): Promise<{success: boolean, status?: Plan['status'], error?: any}> {
    try {
      // Get the plan
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
        
      if (planError) throw planError;
      if (!plan) throw new Error('Plan not found');
      
      // Skip updating status for cancelled or completed plans
      if (plan.status === 'cancelled' || plan.status === 'completed') {
        return { success: true, status: plan.status as Plan['status'] };
      }
      
      // Get all schedule entries for this plan
      const { data: schedules, error: scheduleError } = await supabase
        .from('payment_schedule')
        .select('status, due_date')
        .eq('plan_id', planId);
        
      if (scheduleError) throw scheduleError;
      
      // Count the different statuses
      const counts = {
        paid: 0,
        pending: 0,
        sent: 0,
        paused: 0,
        overdue: 0,
        cancelled: 0
      };
      
      let hasOverduePayments = false;
      
      schedules?.forEach(item => {
        if (item.status in counts) {
          counts[item.status]++;
        }
        
        // Check if any payments are overdue
        if (item.status === 'overdue') {
          hasOverduePayments = true;
        }
      });
      
      // Calculate the total installments and paid installments
      const totalInstallments = schedules?.length || 0;
      const paidInstallments = counts.paid;
      
      // Calculate progress percentage
      let progress = 0;
      if (totalInstallments > 0) {
        progress = Math.round((paidInstallments / totalInstallments) * 100);
      }
      
      // Determine the next due date
      let nextDueDate = null;
      
      if (counts.pending > 0 || counts.sent > 0 || counts.overdue > 0) {
        // Get the earliest pending, sent, or overdue payment
        const { data: nextPayment, error: nextPaymentError } = await supabase
          .from('payment_schedule')
          .select('due_date')
          .eq('plan_id', planId)
          .in('status', ['pending', 'sent', 'overdue'])
          .order('due_date', { ascending: true })
          .limit(1)
          .single();
          
        if (!nextPaymentError && nextPayment) {
          nextDueDate = nextPayment.due_date;
        }
      }
      
      // Determine new status
      let newStatus: Plan['status'] = 'pending';
      
      if (counts.paused > 0 && counts.pending === 0 && counts.sent === 0 && counts.overdue === 0) {
        // If all remaining payments are paused
        newStatus = 'paused';
      } else if (paidInstallments === totalInstallments && totalInstallments > 0) {
        // All payments are completed
        newStatus = 'completed';
      } else if (counts.cancelled === totalInstallments && totalInstallments > 0) {
        // All payments are cancelled
        newStatus = 'cancelled';
      } else if (hasOverduePayments) {
        // Has at least one overdue payment
        newStatus = 'overdue';
      } else if (paidInstallments > 0) {
        // Has at least one paid payment but not all
        newStatus = 'active';
      } else {
        // Default to pending
        newStatus = 'pending';
      }
      
      // Update the plan
      const { error: updateError } = await supabase
        .from('plans')
        .update({
          status: newStatus,
          progress,
          paid_installments: paidInstallments,
          next_due_date: nextDueDate,
          has_overdue_payments: hasOverduePayments,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);
        
      if (updateError) throw updateError;
      
      return { success: true, status: newStatus };
    } catch (error) {
      console.error('Error updating plan status:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Calculate the correct status for a plan based on its payment schedulea
   * This is used directly when we don't want to update the database
   */
  static async calculatePlanStatus(planId: string): Promise<Plan['status']> {
    try {
      const result = await this.updatePlanStatus(planId);
      return result.status || 'pending';
    } catch (error) {
      console.error('Error calculating plan status:', error);
      return 'pending';
    }
  }
}
