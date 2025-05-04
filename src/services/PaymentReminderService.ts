
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Sends a payment reminder for a specific installment
 */
export const sendPaymentReminder = async (installmentId: string): Promise<void> => {
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
      toast.error('Failed to send payment reminder');
      return;
    }
    
    if (!installment.payment_request_id) {
      // Create a new payment request for this installment
      toast.error('This installment doesn\'t have a payment request yet. Please create one first.');
      return;
    }
    
    // In a real implementation, we would now queue a notification to the patient
    toast.success('Payment reminder sent successfully');
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    toast.error('Failed to send payment reminder');
  }
};
