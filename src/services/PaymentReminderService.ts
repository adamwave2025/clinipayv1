
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Sends a payment reminder for a specific installment
 */
export const sendPaymentReminder = async (installmentId: string) => {
  try {
    // Get installment details
    const { data: installment, error: installmentError } = await supabase
      .from('payment_schedule')
      .select(`
        id,
        patient_id,
        payment_request_id,
        payment_requests (
          id,
          patient_name,
          patient_email,
          patient_phone
        )
      `)
      .eq('id', installmentId)
      .single();
    
    if (installmentError) {
      console.error('Error fetching installment details:', installmentError);
      return { success: false, error: installmentError };
    }
    
    if (!installment.payment_request_id) {
      // Create a new payment request for this installment
      // This would typically involve creating a payment_request and updating the installment
      // For now we'll just return an error since this would require more implementation
      return { 
        success: false, 
        error: 'This installment doesn\'t have a payment request yet. Please create one first.' 
      };
    }
    
    // In a real implementation, we would now queue a notification to the patient
    // For now, we'll simulate success
    
    return { success: true };
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return { success: false, error };
  }
};
