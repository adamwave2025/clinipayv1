import { supabase } from '@/integrations/supabase/client';

// We're assuming this is the function with the error on line 136
export const recordPaymentOverdue = async (planId: string, details: any) => {
  try {
    // Get the plan details first to get related IDs
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('patient_id, clinic_id, payment_link_id')
      .eq('id', planId)
      .single();
    
    if (planError) throw planError;
    
    // Record activity
    const { error: activityError } = await supabase
      .from('payment_activity') // Changed from payment_plan_activities to payment_activity
      .insert({
        patient_id: planData.patient_id,
        clinic_id: planData.clinic_id,
        payment_link_id: planData.payment_link_id,
        action_type: 'overdue',
        details: details
      });
    
    if (activityError) throw activityError;
    
    return { success: true };
  } catch (error) {
    console.error('Error recording payment overdue:', error);
    return { success: false, error };
  }
};

// Keep the rest of the file unchanged
