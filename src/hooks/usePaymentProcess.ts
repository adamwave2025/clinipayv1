
import { useState } from 'react';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentLinkData } from './usePaymentLinkData';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

export function usePaymentProcess(linkId: string | undefined, linkData: PaymentLinkData | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const createPaymentIntent = async () => {
    if (!linkData) return null;
    
    // Check if the clinic has Stripe connected
    if (linkData.clinic.stripeStatus !== 'connected') {
      toast.error('This clinic does not have payment processing set up');
      return null;
    }
    
    try {
      setProcessingPayment(true);
      const response = await fetch(`${window.location.origin}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: linkData.amount * 100, // Convert to pence
          clinicId: linkData.clinic.id,
          paymentLinkId: linkData.isRequest ? null : linkData.id,
          requestId: linkData.isRequest ? linkData.id : null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to create payment intent';
        } catch (e) {
          // If not valid JSON, use the text directly
          errorMessage = `Server error: ${errorText.slice(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Payment intent created successfully:', data);
      return data.clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Payment setup failed: ' + error.message);
      return null;
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    if (!linkData || !stripe || !elements) {
      toast.error('Payment system is not initialized');
      return;
    }
    
    // Check if the clinic has Stripe connected before attempting payment
    if (linkData.clinic.stripeStatus !== 'connected') {
      toast.error('This clinic does not have payment processing set up');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First create a payment intent
      const secret = await createPaymentIntent();
      if (!secret) {
        throw new Error('Could not create payment intent');
      }
      
      setClientSecret(secret);
      
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Confirm card payment with the client secret
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
          },
        },
      });
      
      if (paymentError) {
        throw new Error(paymentError.message || 'Payment failed');
      }
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
      
      // After successful payment, create a payment record
      const { data, error } = await supabase
        .from('payments')
        .insert({
          clinic_id: linkData.clinic.id,
          payment_link_id: linkData.isRequest ? null : linkData.id,
          payment_request_id: linkData.isRequest ? linkData.id : null,
          patient_name: formData.name,
          patient_email: formData.email,
          patient_phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
          status: 'paid',
          amount_paid: linkData.amount,
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id
        })
        .select();
      
      if (error) throw error;

      // If this was a payment request, update its status and paid_at
      if (linkData.isRequest) {
        await supabase
          .from('payment_requests')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_id: data[0].id
          })
          .eq('id', linkData.id);
      }
      
      toast.success('Payment successful!');
      
      // Navigate to success page with the link_id parameter
      window.location.href = `/payment/success?link_id=${linkId}&payment_id=${data[0].id}`;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    clientSecret,
    processingPayment,
    handlePaymentSubmit,
  };
}
