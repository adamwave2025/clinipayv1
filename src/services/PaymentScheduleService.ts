
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentPlanActivityParams {
  planId: string;
  actionType: string;
  details?: Record<string, any>;
}

/**
 * Records an activity in the payment_activity table
 */
export const recordPaymentPlanActivity = async ({
  planId,
  actionType,
  details = {}
}: PaymentPlanActivityParams): Promise<void> => {
  try {
    // Get plan info to get related data
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('clinic_id, patient_id, payment_link_id')
      .eq('id', planId)
      .single();
    
    if (planError) throw planError;
    
    // Record the activity
    const { error } = await supabase.from('payment_activity').insert({
      plan_id: planId,
      clinic_id: plan.clinic_id,
      patient_id: plan.patient_id,
      payment_link_id: plan.payment_link_id,
      action_type: actionType,
      details,
      performed_at: new Date().toISOString()
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error recording payment plan activity:', error);
    // Don't show toast for activity recording errors - they're not critical to user
  }
};

/**
 * Update the payment schedule item status
 */
export const updatePaymentScheduleStatus = async (
  scheduleId: string, 
  status: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('payment_schedule')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating payment schedule status:', error);
    toast.error('Failed to update payment status');
    return false;
  }
};

/**
 * Fetch all plans for a user
 */
export const fetchPlans = async (userId: string): Promise<any[]> => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return [];
    }

    const clinicId = userData.clinic_id;
    
    const { data, error } = await supabase
      .from('plans')
      .select(`
        *,
        patients (name)
      `)
      .eq('clinic_id', clinicId);
    
    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchPlans:', error);
    return [];
  }
};

/**
 * Fetch installments for a specific plan
 */
export const fetchPlanInstallments = async (planId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_schedule')
      .select(`
        *,
        payment_requests (
          id, status, paid_at
        )
      `)
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching plan installments:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchPlanInstallments:', error);
    return [];
  }
};

/**
 * Fetch activities for a specific plan
 */
export const fetchPlanActivities = async (planId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_activity')
      .select('*')
      .eq('plan_id', planId)
      .order('performed_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching plan activities:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchPlanActivities:', error);
    return [];
  }
};

/**
 * Cancel a payment plan
 */
export const cancelPaymentPlan = async (planId: string): Promise<{success: boolean, error?: any}> => {
  try {
    // Update plan status
    const { error: planError } = await supabase
      .from('plans')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
    
    if (planError) throw planError;
    
    // Update all pending installments to cancelled
    const { error: scheduleError } = await supabase
      .from('payment_schedule')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('plan_id', planId)
      .eq('status', 'pending');
    
    if (scheduleError) throw scheduleError;
    
    // Record the activity
    await recordPaymentPlanActivity({
      planId,
      actionType: 'plan_cancelled'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling payment plan:', error);
    return { success: false, error };
  }
};

/**
 * Pause a payment plan
 */
export const pausePaymentPlan = async (planId: string): Promise<{success: boolean, error?: any}> => {
  try {
    // Update plan status
    const { error: planError } = await supabase
      .from('plans')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
    
    if (planError) throw planError;
    
    // Record the activity
    await recordPaymentPlanActivity({
      planId,
      actionType: 'plan_paused'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error pausing payment plan:', error);
    return { success: false, error };
  }
};

/**
 * Resume a payment plan
 */
export const resumePaymentPlan = async (planId: string, resumeDate: Date): Promise<{success: boolean, error?: any}> => {
  try {
    // Update plan status
    const { error: planError } = await supabase
      .from('plans')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
    
    if (planError) throw planError;
    
    // Record the activity
    await recordPaymentPlanActivity({
      planId,
      actionType: 'plan_resumed',
      details: {
        resumeDate: resumeDate.toISOString()
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error resuming payment plan:', error);
    return { success: false, error };
  }
};

/**
 * Reschedule a payment plan
 */
export const reschedulePaymentPlan = async (planId: string, newStartDate: Date): Promise<{success: boolean, error?: any}> => {
  try {
    // Update plan start date
    const { error: planError } = await supabase
      .from('plans')
      .update({
        start_date: newStartDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
    
    if (planError) throw planError;
    
    // Record the activity
    await recordPaymentPlanActivity({
      planId,
      actionType: 'plan_rescheduled',
      details: {
        new_start_date: newStartDate.toISOString().split('T')[0]
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rescheduling payment plan:', error);
    return { success: false, error };
  }
};

/**
 * Record a payment refund
 */
export const recordPaymentRefund = async (
  paymentId: string, 
  amount: number, 
  isFullRefund: boolean
): Promise<{success: boolean, error?: any}> => {
  try {
    // Update payment status
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refund_amount: amount,
        refunded_at: new Date().toISOString()
      })
      .eq('id', paymentId);
    
    if (paymentError) throw paymentError;
    
    return { success: true };
  } catch (error) {
    console.error('Error recording payment refund:', error);
    return { success: false, error };
  }
};
