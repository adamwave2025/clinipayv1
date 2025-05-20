
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SendLinkFormData } from './types';

export function usePaymentRequestService() {
  const [isCreatingPaymentRequest, setIsCreatingPaymentRequest] = useState(false);

  const createPaymentRequest = async (
    clinicId: string,
    patientId: string | null,
    formData: SendLinkFormData,
    paymentLinkId: string | null,
    customAmount: number | null
  ) => {
    setIsCreatingPaymentRequest(true);
    
    try {
      console.log('⚠️ CRITICAL: Creating payment request with:', {
        clinicId,
        patientId,
        paymentLinkId,
        amount: customAmount,
        patientName: formData.patientName,
        message: formData.message || null
      });

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: paymentLinkId,
          custom_amount: !paymentLinkId ? customAmount : null,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone ? formData.patientPhone.replace(/\D/g, '') : null,
          status: 'sent',
          message: formData.message || null
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
      
      // Record an activity entry for custom payment requests
      if (!paymentLinkId && customAmount) {
        console.log('Recording custom payment request activity');
        
        // Create activity record for custom payment request
        const { error: activityError } = await supabase
          .from('payment_activity')
          .insert({
            clinic_id: clinicId,
            patient_id: patientId,
            payment_link_id: null,
            action_type: 'custom_payment_sent',
            details: {
              amount: customAmount,
              requestId: paymentRequest.id,
              patientName: formData.patientName,
              patientEmail: formData.patientEmail,
              patientPhone: formData.patientPhone,
              message: formData.message || null
            }
          });
          
        if (activityError) {
          console.error('Error recording custom payment activity:', activityError);
          // Non-blocking, continue with the operation
        }
      }
      
      return paymentRequest;
    } finally {
      setIsCreatingPaymentRequest(false);
    }
  };

  return {
    isCreatingPaymentRequest,
    createPaymentRequest
  };
}
