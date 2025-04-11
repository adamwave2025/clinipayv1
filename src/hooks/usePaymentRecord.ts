
import { useState } from 'react';
import { toast } from 'sonner';
import { PaymentLinkData } from './usePaymentLinkData';

export function usePaymentRecord() {
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);

  const createPaymentRecord = async ({
    paymentIntent,
    linkData,
    formData,
    paymentReference,
    associatedPaymentLinkId
  }: {
    paymentIntent: any;
    linkData: PaymentLinkData;
    formData: {
      name: string;
      email: string;
      phone?: string;
    };
    paymentReference: string;
    associatedPaymentLinkId?: string;
  }) => {
    if (!paymentIntent || !paymentIntent.id) {
      console.error('Missing payment intent data');
      return { success: false, error: 'Invalid payment data' };
    }

    setIsCreatingRecord(true);
    
    try {
      console.log('Payment was successful:', paymentIntent.id);
      console.log('Payment reference:', paymentReference);
      
      // Display the payment reference in the UI
      toast.success(`Payment successful! Reference: ${paymentReference}`);
      
      // Note: The actual payment record is created by the Stripe webhook
      // This function now just handles UI updates after payment
      
      return { success: true };
    } catch (error: any) {
      console.error('Error recording payment:', error);
      return { success: false, error: error.message };
    } finally {
      setIsCreatingRecord(false);
    }
  };

  return {
    isCreatingRecord,
    createPaymentRecord
  };
}
