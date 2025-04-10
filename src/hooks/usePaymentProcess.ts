
import { useState } from 'react';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentLinkData } from './usePaymentLinkData';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

export function usePaymentProcess(linkId: string | undefined, linkData: PaymentLinkData | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Initialize Stripe hooks
  const stripe = useStripe();
  const elements = useElements();

  const handlePaymentSubmit = async (formData: PaymentFormValues, isCardComplete: boolean) => {
    if (!linkData) {
      toast.error('Payment details are missing');
      return;
    }
    
    // Check if the clinic has Stripe connected before attempting payment
    if (linkData.clinic.stripeStatus !== 'connected') {
      toast.error('This clinic does not have payment processing set up');
      return;
    }

    // Validate Stripe is loaded
    if (!stripe || !elements) {
      toast.error('Payment system is still loading');
      return;
    }

    // Check if card is complete
    if (!isCardComplete) {
      toast.error('Please complete the card details');
      return;
    }
    
    setIsSubmitting(true);
    setProcessingPayment(true);
    
    try {
      // Call the create-payment-intent edge function to get a client secret
      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke(
        'create-payment-intent', 
        {
          body: JSON.stringify({
            amount: Math.round(linkData.amount * 100), // Convert to cents for Stripe
            clinicId: linkData.clinic.id,
            paymentLinkId: linkData.isRequest ? null : linkData.id,
            requestId: linkData.isRequest ? linkData.id : null,
          })
        }
      );
      
      if (paymentIntentError) {
        throw new Error(paymentIntentError.message || 'Error creating payment intent');
      }
      
      if (!paymentIntentData.clientSecret) {
        throw new Error('No client secret returned from payment intent');
      }
      
      // Confirm the card payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret, 
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone || undefined,
            },
          },
        }
      );
      
      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }
      
      // Create a payment record in the database
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
          stripe_payment_id: paymentIntent.id
        })
        .select();
      
      if (error) {
        console.error('Error creating payment record:', error);
        throw error;
      }

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
      setProcessingPayment(false);
    }
  };

  return {
    isSubmitting,
    processingPayment,
    handlePaymentSubmit,
  };
}
