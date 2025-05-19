import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { usePaymentIntent } from './usePaymentIntent';
import { usePaymentRecord } from './usePaymentRecord';

export function usePaymentProcess(linkId?: string, linkData?: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();
  
  const { isCreatingIntent, createPaymentIntent } = usePaymentIntent();
  const { isCreatingRecord, createPaymentRecord } = usePaymentRecord();

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    setIsSubmitting(true);
    setProcessingPayment(true);
    
    try {
      // Create payment intent with Stripe
      const { success, clientSecret, associatedPaymentLinkId, error, paymentReference } = 
        await createPaymentIntent({
          linkData,
          formData: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          }
        });
      
      if (!success || !clientSecret) {
        throw new Error(error || 'Failed to create payment intent');
      }

      // Confirm the payment with Stripe Elements
      const stripe = window.stripe;
      const elements = formData.elements;
      
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?link_id=${linkId}&payment_id=${paymentIntent?.id}${paymentReference ? `&request_id=${paymentReference}` : ''}`,
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Record the payment in our database
      await createPaymentRecord({
        paymentIntent,
        linkData,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        associatedPaymentLinkId,
      });

      // Navigate to success page with reference data
      navigate(`/payment/success?link_id=${linkId}&payment_id=${paymentIntent?.id}${paymentReference ? `&request_id=${paymentReference}` : ''}`);
      
    } catch (error: any) {
      console.error('Payment error:', error);
      navigate(`/payment/failed?link_id=${linkId}&error=${encodeURIComponent(error.message || 'Unknown error')}`);
    } finally {
      setIsSubmitting(false);
      setProcessingPayment(false);
    }
  };

  const handleApplePaySubmit = async (data: any) => {
    setIsSubmitting(true);
    setProcessingPayment(true);

    try {
      const { success, clientSecret, associatedPaymentLinkId, error, paymentReference } =
        await createPaymentIntent({
          linkData,
          formData: {
            name: data.name,
            email: data.email,
            phone: data.phone,
          },
          paymentMethod: data.paymentMethod
        });

      if (!success || !clientSecret) {
        throw new Error(error || 'Failed to create payment intent');
      }

      const stripe = window.stripe;

      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        clientSecret: clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?link_id=${linkId}&payment_id=${paymentIntent?.id}${paymentReference ? `&request_id=${paymentReference}` : ''}`,
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Record the payment in our database
      await createPaymentRecord({
        paymentIntent,
        linkData,
        formData: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
        associatedPaymentLinkId,
      });

      navigate(`/payment/success?link_id=${linkId}&payment_id=${paymentIntent?.id}${paymentReference ? `&request_id=${paymentReference}` : ''}`);

    } catch (error: any) {
      console.error('Apple Pay error:', error);
      navigate(`/payment/failed?link_id=${linkId}&error=${encodeURIComponent(error.message || 'Unknown error')}`);
    } finally {
      setIsSubmitting(false);
      setProcessingPayment(false);
    }
  };

  return {
    isSubmitting: isSubmitting || isCreatingIntent || isCreatingRecord,
    processingPayment,
    handlePaymentSubmit,
    handleApplePaySubmit
  };
}
