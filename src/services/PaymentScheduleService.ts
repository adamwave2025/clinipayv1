
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
      .in('status', ['pending', 'upcoming', 'paused'])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error cancelling payment plan:', error);
    toast.error('Failed to cancel payment plan');
    return { success: false, error };
  }
};

export const pausePaymentPlan = async (patientId: string, paymentLinkId: string) => {
  try {
    // Update all pending/upcoming installments for this plan to 'paused'
    const { data, error } = await supabase
      .from('payment_schedule')
      .update({ status: 'paused' })
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .in('status', ['pending', 'upcoming'])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error pausing payment plan:', error);
    toast.error('Failed to pause payment plan');
    return { success: false, error };
  }
};

export const resumePaymentPlan = async (patientId: string, paymentLinkId: string, resumeDate: Date) => {
  try {
    console.log('Original resumeDate received:', resumeDate);
    
    // First get all paused installments for this plan
    const { data: pausedInstallments, error: fetchError } = await supabase
      .from('payment_schedule')
      .select('id, payment_number, payment_frequency')
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .eq('status', 'paused')
      .order('payment_number', { ascending: true });
    
    if (fetchError) throw fetchError;
    
    if (!pausedInstallments || pausedInstallments.length === 0) {
      return { success: true, message: 'No paused installments found' };
    }
    
    // Calculate new due dates for each installment
    const frequency = pausedInstallments[0]?.payment_frequency || 'monthly';
    const updatePromises = pausedInstallments.map((installment, index) => {
      // Calculate new due date based on the resume date and installment index
      const newDueDate = calculateNewDueDate(resumeDate, index, frequency);
      const formattedDate = newDueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      console.log(`Installment ${installment.payment_number}, new due date: ${formattedDate}`);
      
      return supabase
        .from('payment_schedule')
        .update({ 
          status: 'pending',
          due_date: formattedDate
        })
        .eq('id', installment.id);
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    return { success: true };
  } catch (error) {
    console.error('Error resuming payment plan:', error);
    toast.error('Failed to resume payment plan');
    return { success: false, error };
  }
};

// Helper function to calculate new due date based on frequency
function calculateNewDueDate(startDate: Date, index: number, frequency: string): Date {
  // Create a new date object to avoid mutating the original date
  const newDate = new Date(startDate);
  
  // Ensure the date is set to the start of the day to avoid timezone issues
  newDate.setHours(0, 0, 0, 0);
  
  console.log(`Index: ${index}, Original date: ${newDate.toISOString()}`);
  
  switch (frequency) {
    case 'daily':
      newDate.setDate(newDate.getDate() + index);
      break;
    case 'weekly':
      newDate.setDate(newDate.getDate() + (index * 7));
      break;
    case 'biweekly':
      newDate.setDate(newDate.getDate() + (index * 14));
      break;
    case 'monthly':
      newDate.setMonth(newDate.getMonth() + index);
      break;
    case 'quarterly':
      newDate.setMonth(newDate.getMonth() + (index * 3));
      break;
    case 'yearly':
      newDate.setFullYear(newDate.getFullYear() + index);
      break;
    default:
      newDate.setMonth(newDate.getMonth() + index);
  }
  
  console.log(`After calculation: ${newDate.toISOString()}`);
  
  return newDate;
}
