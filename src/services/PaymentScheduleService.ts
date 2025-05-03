import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchUserClinicId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.clinic_id;
  } catch (error) {
    console.error('Error fetching user clinic ID:', error);
    return null;
  }
};

export const fetchPaymentSchedules = async (clinicId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_schedule')
      .select(`
        id,
        patient_id,
        payment_link_id,
        amount,
        due_date,
        payment_number,
        total_payments,
        status,
        payment_request_id,
        payment_requests (
          id,
          status,
          payment_id
        ),
        patients (
          id,
          name,
          email,
          phone
        ),
        payment_links (
          id,
          title,
          amount,
          plan_total_amount
        )
      `)
      .eq('clinic_id', clinicId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payment schedules:', error);
    toast.error('Failed to load payment plans');
    return [];
  }
};

export const fetchPlanInstallments = async (patientId: string, paymentLinkId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_schedule')
      .select(`
        id,
        amount,
        due_date,
        payment_number,
        total_payments,
        status,
        payment_request_id,
        payment_requests (
          id,
          payment_id,
          paid_at,
          status
        )
      `)
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .order('payment_number', { ascending: true });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching plan installments:', error);
    toast.error('Failed to load payment details');
    return [];
  }
};

export const cancelPaymentPlan = async (patientId: string, paymentLinkId: string) => {
  try {
    // Update all pending installments for this plan to 'cancelled'
    const { data, error } = await supabase
      .from('payment_schedule')
      .update({ status: 'cancelled' })
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .in('status', ['pending', 'upcoming'])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error cancelling payment plan:', error);
    toast.error('Failed to cancel payment plan');
    return { success: false, error };
  }
};
