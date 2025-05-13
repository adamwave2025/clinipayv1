
import { useState } from 'react';
import { usePaymentLinkSender as useOriginalPaymentLinkSender } from '@/hooks/usePaymentLinkSender';
import { PaymentLink } from '../../types/paymentLink';
import { SendLinkFormData } from './useSendLinkFormState';
import { toast } from 'sonner';

interface SendPaymentLinkParams {
  formData: SendLinkFormData;
  paymentLinks: PaymentLink[];
  patientId: string;
}

export function usePaymentLinkSender() {
  const { isLoading: isOriginalLoading, sendPaymentLink: originalSendPaymentLink } = useOriginalPaymentLinkSender();
  const [isSending, setIsSending] = useState(false);

  const sendPaymentLink = async ({ formData, paymentLinks, patientId }: SendPaymentLinkParams) => {
    setIsSending(true);

    try {
      // Check if patient ID is valid
      if (!patientId) {
        console.error('Invalid patient ID provided to sendPaymentLink:', patientId);
        toast.error('Invalid patient ID');
        setIsSending(false);
        return { success: false };
      }

      console.log('Sending payment link for patient ID:', patientId);
      
      // Now use the original send payment link function with enhanced parameters
      const enhancedFormData = {
        ...formData,
        patientId // Add the patient ID to the form data
      };
      
      const result = await originalSendPaymentLink({ 
        formData: enhancedFormData, 
        paymentLinks
      });
      
      // No toasts here - we'll show one comprehensive toast at the end in useSendLinkPageState
      return result;
    } catch (error) {
      console.error('Error sending payment link:', error);
      toast.error('Failed to send payment link');
      return { success: false };
    } finally {
      setIsSending(false);
    }
  };

  return {
    isLoading: isOriginalLoading || isSending,
    sendPaymentLink
  };
}
