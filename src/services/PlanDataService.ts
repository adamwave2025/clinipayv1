
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
      
      // First, just fetch the basic schedule data without any nested selects
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('payment_schedule')
        .select(`
          id, 
          payment_number,
          total_payments,
          due_date,
          amount,
          status,
          payment_request_id,
          plan_id
        `)
        .eq('plan_id', plan.id)
        .order('payment_number', { ascending: true });
        
      if (scheduleError) {
        console.error('Database error fetching installments:', scheduleError);
        throw scheduleError;
      }
      
      // If we have no schedule data, return empty array
      if (!scheduleData || scheduleData.length === 0) {
        console.warn(`No installments found for plan ${plan.id}`);
        return [];
      }
      
      console.log(`Retrieved ${scheduleData.length} installments from database`);
      
      // Now enhance the data with payment information separately
      const enhancedInstallments = await Promise.all(scheduleData.map(async (item) => {
        // Initialize default values
        let paymentData = null;
        let manualPayment = false;
        let paidDate = null;
        
        try {
          // If there's a payment request, check for payment information
          if (item.payment_request_id) {
            const { data: requestData } = await supabase
              .from('payment_requests')
              .select('id, payment_id, paid_at, status')
              .eq('id', item.payment_request_id)
              .maybeSingle();
              
            if (requestData && requestData.payment_id) {
              const { data: paymentInfo } = await supabase
                .from('payments')
                .select('id, manual_payment, paid_at, status')
                .eq('id', requestData.payment_id)
                .maybeSingle();
                
              if (paymentInfo) {
                paymentData = paymentInfo;
                manualPayment = !!paymentInfo.manual_payment;
                paidDate = paymentInfo.paid_at;
              } else if (requestData.paid_at) {
                // Fallback to request data if available
                paidDate = requestData.paid_at;
              }
            }
          }
          
          // Also check for direct payments linked to this schedule
          // This is removed to simplify the code as it was causing issues
          // Direct payment relationship can be handled elsewhere if needed
        } catch (err) {
          console.error(`Error enriching installment ${item.id}:`, err);
        }
        
        // Return the enhanced item
        return {
          ...item,
          payment: paymentData,
          manualPayment: manualPayment,
          paidDate: paidDate
        };
      }));
      
      console.log('Enhanced installments with payment data:', enhancedInstallments);
      
      // Format the installments using our utility function
      const formattedInstallments = formatPlanInstallments(enhancedInstallments);
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
