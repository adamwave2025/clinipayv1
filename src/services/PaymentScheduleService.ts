
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
