
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
  // Note: The imported hook only exposes isSending, not isLoading
  const { isSending: isOriginalLoading, sendPaymentLink: originalSendPaymentLink } = useOriginalPaymentLinkSender();
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
      
      // Find the selected payment link
      const selectedLink = paymentLinks.find(link => link.id === formData.selectedLink);
      if (!selectedLink) {
        console.error('Selected payment link not found');
        toast.error('Selected payment link not found');
        setIsSending(false);
        return { success: false };
      }

      // Get the payment amount from either the link or custom amount
      const paymentAmount = formData.customAmount ? parseFloat(formData.customAmount) : selectedLink.amount;
      
      // Call the original sendPaymentLink with the correct number of arguments
      const result = await originalSendPaymentLink(
        { id: patientId, name: formData.patientName, email: formData.patientEmail, phone: formData.patientPhone },
        formData.selectedLink,
        paymentAmount,
        formData.message || undefined
      );
      
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
    // Rename to match what consuming code expects
    isLoading: isOriginalLoading || isSending,
    sendPaymentLink
  };
}
