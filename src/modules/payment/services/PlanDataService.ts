
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
      
      // Get all payment schedules for this plan with a cleaner query structure
      // Important: Don't use nested selection with payments (*) as the relationship
      // might not be properly defined in the database
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
      
      // Now fetch payment information separately and then join it with the schedules
      // This approach avoids potential database relationship issues
      const enhancedInstallments = await Promise.all(scheduleData.map(async (item) => {
        // For each schedule item, check if there's an associated payment request
        let paymentData = null;
        let manualPayment = false;
        let paidDate = null;
        
        if (item.payment_request_id) {
          // If there's a payment request, check if it has an associated payment
          const { data: requestData } = await supabase
            .from('payment_requests')
            .select(`
              id,
              payment_id,
              paid_at,
              status
            `)
            .eq('id', item.payment_request_id)
            .maybeSingle();
            
          if (requestData && requestData.payment_id) {
            // If payment request has a payment, get the payment details
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
              // If request has paid_at but no payment details, use request data
              paidDate = requestData.paid_at;
            }
          }
        }
        
        // We might also have direct payment links (not through a request)
        // Check for direct payments linked to this schedule
        if (!paymentData) {
          const { data: directPayments } = await supabase
            .from('payments')
            .select('id, manual_payment, paid_at, status')
            .eq('payment_schedule_payment_id', item.id)
            .maybeSingle();
            
          if (directPayments) {
            paymentData = directPayments;
            manualPayment = !!directPayments.manual_payment;
            paidDate = directPayments.paid_at;
          }
        }
        
        // Return the enhanced schedule item
        return {
          ...item,
          payment: paymentData,
          manualPayment: manualPayment,
          paidDate: paidDate
        };
      }));
      
      console.log('Enhanced installments with payment data:', enhancedInstallments);
      
      // Format the installments
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
