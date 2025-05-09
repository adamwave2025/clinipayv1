
import { supabase } from '@/integrations/supabase/client';
import { Plan, formatPlanFromDb } from '@/utils/planTypes';
import { toast } from 'sonner';

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
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
    
    if (error) {
      throw error;
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
