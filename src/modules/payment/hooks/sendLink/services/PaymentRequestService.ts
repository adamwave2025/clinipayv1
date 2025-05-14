
import { supabase } from '@/integrations/supabase/client';

export const PaymentRequestService = {
  /**
   * Create a new payment request
   */
  async createPaymentRequest(
    clinicId: string,
    patientId: string | null,
    patientName: string,
    patientEmail: string | undefined,
    patientPhone: string | undefined,
    paymentLinkId: string | null,
    customAmount: number | null,
    message: string | null
  ) {
    try {
      console.log('⚠️ CRITICAL: Creating payment request with:', {
        clinicId,
        patientId,
        paymentLinkId,
        amount: customAmount,
        patientName,
        message
      });

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: paymentLinkId,
          custom_amount: !paymentLinkId ? customAmount : null,
          patient_name: patientName,
          patient_email: patientEmail,
          patient_phone: patientPhone ? patientPhone.replace(/\D/g, '') : null,
          status: 'sent',
          message: message || null
        })
        .select();

      if (error) {
        console.error('⚠️ CRITICAL ERROR: Error creating payment request:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('⚠️ CRITICAL ERROR: No data returned from payment request creation');
        throw new Error('Failed to create payment request');
      }

      const paymentRequest = data[0];
      console.log('⚠️ CRITICAL: Payment request created successfully:', paymentRequest.id);
      
      return paymentRequest;
    } catch (error) {
      console.error('⚠️ CRITICAL ERROR: Error creating payment request:', error);
      throw error;
    }
  }
};
