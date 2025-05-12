
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { toast } from 'sonner';

/**
 * Service for performing operations on payment plans
 */
export class PlanOperationsService {
  /**
   * Cancel a payment plan
   */
  static async cancelPlan(plan: Plan): Promise<boolean> {
    try {
      if (!plan || !plan.id) {
        console.error('Cannot cancel plan: Invalid plan object');
        return false;
      }
      
      // Update the plan status to cancelled
      const { error } = await supabase
        .from('plans')
        .update({ status: 'cancelled' })
        .eq('id', plan.id);
      
      if (error) {
        console.error('Error cancelling plan:', error);
        throw error;
      }
      
      // Log activity
      await this.logPlanActivity(plan.id, 'plan_cancelled', { 
        planId: plan.id,
        planName: plan.title || plan.planName 
      });
      
      return true;
    } catch (err) {
      console.error('Error in cancelPlan:', err);
      return false;
    }
  }
  
  /**
   * Pause a payment plan
   */
  static async pausePlan(plan: Plan): Promise<boolean> {
    try {
      if (!plan || !plan.id) {
        console.error('Cannot pause plan: Invalid plan object');
        return false;
      }
      
      // Update the plan status to paused
      const { error } = await supabase
        .from('plans')
        .update({ status: 'paused' })
        .eq('id', plan.id);
      
      if (error) {
        console.error('Error pausing plan:', error);
        throw error;
      }
      
      // Log activity
      await this.logPlanActivity(plan.id, 'plan_paused', { 
        planId: plan.id,
        planName: plan.title || plan.planName 
      });
      
      return true;
    } catch (err) {
      console.error('Error in pausePlan:', err);
      return false;
    }
  }
  
  /**
   * Resume a payment plan
   */
  static async resumePlan(plan: Plan, resumeDate: Date): Promise<boolean> {
    try {
      if (!plan || !plan.id) {
        console.error('Cannot resume plan: Invalid plan object');
        return false;
      }
      
      // Format date for database
      const formattedDate = resumeDate.toISOString();
      
      // Update the plan status to active and set next due date
      const { error } = await supabase
        .from('plans')
        .update({ 
          status: 'active',
          next_due_date: formattedDate
        })
        .eq('id', plan.id);
      
      if (error) {
        console.error('Error resuming plan:', error);
        throw error;
      }
      
      // Log activity
      await this.logPlanActivity(plan.id, 'plan_resumed', { 
        planId: plan.id,
        planName: plan.title || plan.planName,
        resumeDate: formattedDate
      });
      
      return true;
    } catch (err) {
      console.error('Error in resumePlan:', err);
      return false;
    }
  }
  
  /**
   * Mark a payment as paid
   */
  static async markAsPaid(installmentId: string, planId: string): Promise<boolean> {
    try {
      if (!installmentId) {
        console.error('Cannot mark as paid: Invalid installment ID');
        return false;
      }
      
      // Get current date
      const now = new Date();
      const paidDate = now.toISOString();
      
      // Update the payment schedule item as paid
      const { error } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'paid',
          paid_date: paidDate
        })
        .eq('id', installmentId);
      
      if (error) {
        console.error('Error marking payment as paid:', error);
        throw error;
      }
      
      // Log activity if we have a plan ID
      if (planId) {
        await this.logPlanActivity(planId, 'payment_marked_paid', { 
          installmentId,
          paidDate
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error in markAsPaid:', err);
      return false;
    }
  }
  
  /**
   * Log an activity for a plan
   */
  private static async logPlanActivity(planId: string, actionType: string, details: any): Promise<void> {
    try {
      // Get clinic ID for the plan
      const { data: planData } = await supabase
        .from('plans')
        .select('clinic_id, patient_id')
        .eq('id', planId)
        .single();
      
      if (!planData) {
        console.error('Could not find plan for activity logging');
        return;
      }
      
      // Insert activity record
      await supabase.from('payment_activity').insert({
        plan_id: planId,
        clinic_id: planData.clinic_id,
        patient_id: planData.patient_id,
        action_type: actionType,
        details: details,
        performed_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error logging plan activity:', err);
    }
  }
}
