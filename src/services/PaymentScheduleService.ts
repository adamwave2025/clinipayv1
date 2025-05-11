import { supabase } from '@/integrations/supabase/client';
import { Plan, formatPlanFromDb } from '@/utils/planTypes';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PlanOperationsService } from '@/services/PlanOperationsService';

/**
 * Fetch plans directly from the plans table
 */
export const fetchPlans = async (userId: string): Promise<Plan[]> => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', userId)
      .single();
      
    if (userError) {
      throw userError;
    }

    const clinicId = userData.clinic_id;
    
    const { data, error } = await supabase
      .from('plans')
      .select(`
        *,
        patients (
          id, name, email
        )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log('Raw plans data from DB:', data);
    
    // Format the plans using the helper function
    const formattedPlans = data.map(plan => {
      const formatted = formatPlanFromDb(plan);
      // Ensure patientName is set correctly
      if (!formatted.patientName && formatted.patients?.name) {
        formatted.patientName = formatted.patients.name;
      }
      return formatted;
    });
    
    console.log('Formatted plans:', formattedPlans);
    
    return formattedPlans;
  } catch (error) {
    console.error('Error fetching plans:', error);
    toast.error('Failed to load payment plans');
    return [];
  }
};

export const fetchPlanInstallments = async (planId: string) => {
  try {
    // First, get the payment_link_id for this plan to use later
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('payment_link_id')
      .eq('id', planId)
      .single();
    
    if (planError) {
      console.error('Error fetching plan details:', planError);
      throw planError;
    }
    
    // Now fetch the payment schedule entries with their payment requests AND directly join with payments
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
          payments(
            id, status, paid_at, manual_payment
          )
        ),
        payments (
          id, status, paid_at, manual_payment
        )
      `)
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching plan installments:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} installments for plan ${planId}`);
    if (data && data.length > 0) {
      data.forEach(item => {
        // Log detailed payment information for debugging
        console.log(`Installment ${item.id} (status: ${item.status}):`);
        if (item.payments && item.payments.length > 0) {
          console.log(`  Direct payment found: paid_at=${item.payments[0].paid_at}, manual=${item.payments[0].manual_payment}`);
        }
        if (item.payment_requests && item.payment_requests.payments) {
          console.log(`  Payment via request: paid_at=${item.payment_requests.paid_at}, payment_id=${item.payment_requests.payment_id}`);
        }
      });
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching plan installments:', error);
    toast.error('Failed to load payment installments');
    return [];
  }
};

export const fetchPlanActivities = async (planId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_activity')
      .select('*')
      .eq('plan_id', planId)
      .order('performed_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching plan activities:', error);
    toast.error('Failed to load plan activities');
    return [];
  }
};

/**
 * Record activity for a payment plan
 */
export const recordPaymentPlanActivity = async (params: {
  planId: string;
  actionType: string;
  details?: any;
}) => {
  try {
    // Get plan details to populate related fields
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('clinic_id, patient_id, payment_link_id')
      .eq('id', params.planId)
      .single();
      
    if (planError) {
      console.error('Error fetching plan data for activity record:', planError);
      throw planError;
    }
    
    const performedByUserId = (await supabase.auth.getUser()).data.user?.id;
    
    const activityData = {
      plan_id: params.planId,
      clinic_id: planData.clinic_id,
      patient_id: planData.patient_id,
      payment_link_id: planData.payment_link_id,
      action_type: params.actionType,
      details: params.details || {},
      performed_at: new Date().toISOString(),
      performed_by_user_id: performedByUserId
    };
    
    const { error } = await supabase
      .from('payment_activity')
      .insert(activityData);
      
    if (error) {
      console.error('Error recording plan activity:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to record payment plan activity:', error);
    return { success: false, error };
  }
};

/**
 * Cancel a payment plan
 * @deprecated Use PlanOperationsService.cancelPlan instead
 */
export const cancelPaymentPlan = async (planId: string) => {
  console.warn('DEPRECATED: cancelPaymentPlan is deprecated. Use PlanOperationsService.cancelPlan instead.');
  
  try {
    // Get the plan details first to provide to PlanOperationsService
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError) {
      throw planError;
    }
    
    const plan = formatPlanFromDb(planData);
    
    // Use the new service method
    const success = await PlanOperationsService.cancelPlan(plan);
    return { success };
    
  } catch (error) {
    console.error('Error in deprecated cancelPaymentPlan:', error);
    return { success: false, error };
  }
};

/**
 * Pause a payment plan
 * @deprecated Use PlanOperationsService.pausePlan instead
 */
export const pausePaymentPlan = async (planId: string) => {
  console.warn('DEPRECATED: pausePaymentPlan is deprecated. Use PlanOperationsService.pausePlan instead.');
  
  try {
    // Get the plan details first to provide to PlanOperationsService
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError) {
      throw planError;
    }
    
    const plan = formatPlanFromDb(planData);
    
    // Use the new service method
    const success = await PlanOperationsService.pausePlan(plan);
    return { success };
    
  } catch (error) {
    console.error('Error in deprecated pausePaymentPlan:', error);
    return { success: false, error };
  }
};

/**
 * Resume a paused payment plan
 * @deprecated Use PlanOperationsService.resumePlan instead
 */
export const resumePaymentPlan = async (planId: string, resumeDate: Date) => {
  console.warn('DEPRECATED: resumePaymentPlan is deprecated. Use PlanOperationsService.resumePlan instead.');
  
  try {
    // Get the plan details first to provide to PlanOperationsService
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError) {
      throw planError;
    }
    
    const plan = formatPlanFromDb(planData);
    
    // Use the new service method
    const success = await PlanOperationsService.resumePlan(plan, resumeDate);
    return { success };
    
  } catch (error) {
    console.error('Error in deprecated resumePaymentPlan:', error);
    return { success: false, error };
  }
};

/**
 * Reschedule all remaining payments in a plan
 * @deprecated Use PlanOperationsService.reschedulePlan instead
 */
export const reschedulePaymentPlan = async (planId: string, newStartDate: Date) => {
  console.warn('DEPRECATED: reschedulePaymentPlan is deprecated. Use PlanOperationsService.reschedulePlan instead.');
  
  try {
    // Get the plan details first to provide to PlanOperationsService
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError) {
      throw planError;
    }
    
    const plan = formatPlanFromDb(planData);
    
    // Use the new service method
    const success = await PlanOperationsService.reschedulePlan(plan, newStartDate);
    return { success };
    
  } catch (error) {
    console.error('Error in deprecated reschedulePaymentPlan:', error);
    return { success: false, error };
  }
};

/**
 * Record a refund for a payment
 * @deprecated Use PlanOperationsService.recordPaymentRefund instead
 */
export const recordPaymentRefund = async (paymentId: string, amount: number, isFullRefund: boolean) => {
  console.warn('DEPRECATED: recordPaymentRefund is deprecated. Use PlanOperationsService.recordPaymentRefund instead.');
  
  try {
    // Use the new service method
    const result = await PlanOperationsService.recordPaymentRefund(paymentId, amount, isFullRefund);
    return result;
  } catch (error) {
    console.error('Error in deprecated recordPaymentRefund:', error);
    return { success: false, error };
  }
};

/**
 * Helper function to calculate new payment dates based on frequency
 * @deprecated Use PlanOperationsService private methods instead
 */
const calculateNewPaymentDates = (startDate: Date, frequency: string, count: number): string[] => {
  console.warn('DEPRECATED: calculateNewPaymentDates is deprecated. This functionality is now internal to PlanOperationsService.');
  
  const dates: string[] = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    
    // Calculate next date based on frequency
    if (frequency === 'weekly') {
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
    } else if (frequency === 'bi-weekly') {
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 14));
    } else if (frequency === 'monthly') {
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    } else {
      // Default to monthly if frequency is unknown
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }
  }
  
  return dates;
};
