import { supabase } from '@/integrations/supabase/client';
import { Plan, formatPlanFromDb } from '@/utils/planTypes';
import { formatPlanInstallments, PlanInstallment } from '@/utils/paymentPlanUtils';
import { formatPlanActivities } from '@/utils/planActivityUtils';
import { PlanActivity } from '@/utils/planActivityUtils';
import { toast } from 'sonner';

/**
 * Service for fetching and managing payment plan data
 */
export class PlanDataService {
  /**
   * Fetch payment plan installments from the database
   */
  static async fetchPlanInstallments(plan: Plan): Promise<PlanInstallment[]> {
    try {
      // Get all payment schedules for this plan
      const { data, error } = await supabase
        .from('payment_schedule')
        .select(`
          id, 
          payment_number,
          total_payments,
          due_date,
          amount,
          status,
          payment_request_id,
          plan_id,
          payment_requests (
            id, status, payment_id, paid_at
          )
        `)
        .eq('plan_id', plan.id)
        .order('payment_number', { ascending: true });
        
      if (error) throw error;
      
      return formatPlanInstallments(data || []);
      
    } catch (err) {
      console.error('Error fetching plan installments:', err);
      toast.error('Failed to load payment installments');
      return [];
    }
  }
  
  /**
   * Fetch plan activities from the database
   */
  static async fetchPlanActivities(plan: Plan): Promise<PlanActivity[]> {
    try {
      // Get all activities for this plan
      const { data, error } = await supabase
        .from('payment_activity') // Using the new table name
        .select('*')
        .eq('payment_link_id', plan.paymentLinkId)
        .order('performed_at', { ascending: false });
        
      if (error) throw error;
      
      return formatPlanActivities(data || []);
      
    } catch (err) {
      console.error('Error fetching plan activities:', err);
      toast.error('Failed to load plan activities');
      return [];
    }
  }

  /**
   * Fetch both installments and activities for a plan
   */
  static async fetchPlanDetails(plan: Plan): Promise<{
    installments: PlanInstallment[];
    activities: PlanActivity[];
  }> {
    const installments = await this.fetchPlanInstallments(plan);
    const activities = await this.fetchPlanActivities(plan);
    
    return { installments, activities };
  }
}
