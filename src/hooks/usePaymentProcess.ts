import { useState } from 'react';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { toast } from 'sonner';
import { PaymentLinkData } from './usePaymentLinkData';
import { useStripePayment } from './useStripePayment';
import { usePaymentIntent } from './usePaymentIntent';
import { usePaymentRecord } from './usePaymentRecord';

export function usePaymentProcess(linkId: string | undefined, linkData: PaymentLinkData | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const { isProcessing, processPayment } = useStripePayment();
  const { isCreatingIntent, createPaymentIntent } = usePaymentIntent();
  const { createPaymentRecord } = usePaymentRecord();

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    if (!linkData) {
      toast.error('Payment details are missing');
      return;
    }
    
    // Set isSubmitting to true to disable form inputs
    setIsSubmitting(true);
    
    try {
      // Step 1: Create payment intent
      const intentResult = await createPaymentIntent({
        linkData,
        formData
      });
      
      if (!intentResult.success) {
        throw new Error(intentResult.error || 'Failed to create payment intent');
      }
      
      // Step 2: Now set processingPayment to true to show the overlay, but keep the form mounted
      setProcessingPayment(true);
      
      // Step 3: Process the payment with Stripe
      const paymentResult = await processPayment({
        clientSecret: intentResult.clientSecret,
        formData,
        paymentAttemptId: intentResult.paymentAttemptId
      });
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
      
      // Step 4: Create payment record in our database
      const recordResult = await createPaymentRecord({
        paymentIntent: paymentResult.paymentIntent,
        linkData,
        formData,
        paymentReference: intentResult.paymentReference,
        associatedPaymentLinkId: intentResult.associatedPaymentLinkId
      });
      
      toast.success('Payment successful!');
      
      // Navigate to success page with the link_id parameter
      window.location.href = `/payment/success?link_id=${linkId}&payment_id=${recordResult.paymentId || 'unknown'}`;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
      setProcessingPayment(false);
    }
  };

  return {
    isSubmitting: isSubmitting || isCreatingIntent || isProcessing,
    processingPayment,
    handlePaymentSubmit,
  };
}
