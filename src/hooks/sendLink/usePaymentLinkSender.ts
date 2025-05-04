
import { useState } from 'react';
import { usePaymentLinkSender as useOriginalPaymentLinkSender } from '@/hooks/usePaymentLinkSender';
import { PaymentLink } from '@/types/payment';
import { SendLinkFormData } from './useSendLinkFormState';
import { toast } from 'sonner';

interface SendPaymentLinkParams {
  formData: SendLinkFormData;
  paymentLinks: PaymentLink[];
  patientId: string;
}

export function usePaymentLinkSender() {
  const { isLoading, sendPaymentLink: originalSendPaymentLink } = useOriginalPaymentLinkSender();
  const [isSending, setIsSending] = useState(false);

  const sendPaymentLink = async ({ formData, paymentLinks, patientId }: SendPaymentLinkParams) => {
    setIsSending(true);

    try {
      // Check if patient ID is valid
      if (!patientId) {
        toast.error('Invalid patient ID');
        return { success: false };
      }

      // Now use the original send payment link function with enhanced parameters
      const enhancedFormData = {
        ...formData,
        patientId // Add the patient ID to the form data
      };
      
      const result = await originalSendPaymentLink({ 
        formData: enhancedFormData, 
        paymentLinks
      });
      
      setIsSending(false);
      return result;
    } catch (error) {
      console.error('Error sending payment link:', error);
      toast.error('Failed to send payment link');
      setIsSending(false);
      return { success: false };
    }
  };

  return {
    isLoading: isLoading || isSending,
    sendPaymentLink
  };
}
