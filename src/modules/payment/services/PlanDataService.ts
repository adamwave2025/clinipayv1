
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
      console.log('PlanDataService: Fetching installments for plan:', plan.id);
      
      // Get all payment schedules for this plan with extended query to include 
      // both payment_requests and direct payments information
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
            id, status, payment_id, paid_at,
            payments (
              id, status, paid_at, manual_payment
            )
          ),
          payments (
            id, status, paid_at, manual_payment
          )
        `)
        .eq('plan_id', plan.id)
        .order('payment_number', { ascending: true });
        
      if (error) {
        console.error('Database error fetching installments:', error);
        throw error;
      }
      
      console.log('Raw installment data with payments:', data);
      
      // Add detailed logging to understand the data structure
      if (data && data.length > 0) {
        console.log(`First installment sample:`, JSON.stringify(data[0], null, 2));
        
        // Check payment_requests nesting
        if (data[0].payment_requests) {
          console.log(`payment_requests sample:`, JSON.stringify(data[0].payment_requests, null, 2));
        }
        
        // Check direct payments nesting
        if (data[0].payments) {
          console.log(`direct payments sample:`, JSON.stringify(data[0].payments, null, 2));
        }
      } else {
        console.warn(`No installments found for plan ${plan.id}`);
      }
      
      const formattedInstallments = formatPlanInstallments(data || []);
      console.log('PlanDataService: Formatted installments:', formattedInstallments.length);
      
      return formattedInstallments;
      
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
      // Always try to get activities by plan_id first - this is the most reliable approach
      const { data, error } = await supabase
        .from('payment_activity')
        .select('*')
        .eq('plan_id', plan.id)
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
