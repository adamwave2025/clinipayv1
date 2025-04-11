import { useState } from 'react';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentLinkData } from './usePaymentLinkData';
import { useStripe, useElements } from '@stripe/react-stripe-js';

export function usePaymentProcess(linkId: string | undefined, linkData: PaymentLinkData | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    if (!linkData) {
      toast.error('Payment details are missing');
      return;
    }
    
    // Check if the clinic has Stripe connected before attempting payment
    if (linkData.clinic.stripeStatus !== 'connected') {
      toast.error('This clinic does not have payment processing set up');
      return;
    }

    if (!stripe || !elements) {
      toast.error('Stripe has not been initialized');
      return;
    }

    const cardElement = elements.getElement('card');
    if (!cardElement) {
      toast.error('Card information is not complete');
      return;
    }
    
    // Set isSubmitting to true to disable form inputs
    setIsSubmitting(true);
    
    try {
      console.log('Initiating payment process for link ID:', linkId);
      console.log('Payment amount:', linkData.amount);
      console.log('Is request payment:', linkData.isRequest);
      
      // Call the create-payment-intent edge function to get a client secret
      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke(
        'create-payment-intent', 
        {
          body: JSON.stringify({
            amount: Math.round(linkData.amount * 100), // Convert to cents for Stripe
            clinicId: linkData.clinic.id,
            paymentLinkId: linkData.isRequest ? null : linkData.id,
            requestId: linkData.isRequest ? linkData.id : null,
            paymentMethod: {
              billing_details: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined
              }
            }
          })
        }
      );
      
      if (paymentIntentError) {
        console.error('Payment intent error:', paymentIntentError);
        throw new Error(paymentIntentError.message || 'Error creating payment intent');
      }
      
      if (!paymentIntentData.success || !paymentIntentData.clientSecret) {
        console.error('Payment intent unsuccessful:', paymentIntentData);
        throw new Error(paymentIntentData.error || 'Payment processing failed');
      }
      
      const paymentReference = paymentIntentData.paymentReference;
      console.log('Payment reference:', paymentReference);
      
      // Get the associated payment link ID (if any) from the response
      // This will be used when creating the payment record
      const associatedPaymentLinkId = paymentIntentData.paymentLinkId;
      console.log('Associated payment link ID:', associatedPaymentLinkId);
      
      // Get the payment attempt ID if provided
      const paymentAttemptId = paymentIntentData.attemptId;
      console.log('Payment attempt ID:', paymentAttemptId);
      
      // Now set processingPayment to true to show the overlay, but keep the form mounted
      setProcessingPayment(true);
      
      // Confirm the card payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret, 
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone || undefined
            }
          }
        }
      );
      
      if (stripeError) {
        console.error('Stripe payment error:', stripeError);
        
        // Update payment attempt status if we have an attempt ID
        if (paymentAttemptId) {
          try {
            await supabase
              .from('payment_attempts')
              .update({ status: 'failed' })
              .eq('id', paymentAttemptId);
          } catch (updateError) {
            console.error('Failed to update payment attempt status:', updateError);
          }
        }
        
        throw new Error(stripeError.message || 'Payment failed');
      }
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
      
      console.log('Payment successful, creating payment record in database');
      
      // Create a payment record in the database
      const { data, error } = await supabase
        .from('payments')
        .insert({
          clinic_id: linkData.clinic.id,
          payment_link_id: associatedPaymentLinkId || (linkData.isRequest ? null : linkData.id),
          patient_name: formData.name,
          patient_email: formData.email,
          patient_phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
          status: 'paid',
          amount_paid: linkData.amount,
          paid_at: new Date().toISOString(),
          stripe_payment_id: paymentIntent.id,
          payment_ref: paymentReference // Save the payment reference
        })
        .select();
      
      if (error) {
        console.error('Error creating payment record:', error);
        toast.error('Payment successful, but we could not create a payment record');
      } else {
        console.log('Payment record created successfully:', data);
        
        // Update payment attempt status if we have an attempt ID
        if (paymentAttemptId) {
          try {
            await supabase
              .from('payment_attempts')
              .update({ status: 'succeeded' })
              .eq('id', paymentAttemptId);
          } catch (updateError) {
            console.error('Failed to update payment attempt status:', updateError);
          }
        }
      }

      // If this was a payment request, update its status and paid_at
      if (linkData.isRequest && data && data.length > 0) {
        console.log('Updating payment request status to paid');
        const { error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_id: data[0].id // Set the payment_id to link to the payment record
          })
          .eq('id', linkData.id);
          
        if (requestUpdateError) {
          console.error('Error updating payment request:', requestUpdateError);
          toast.error('Payment successful, but we could not update payment request status');
        } else {
          console.log('Successfully updated payment request with payment_id:', data[0].id);
        }
      }
      
      toast.success('Payment successful!');
      
      // Navigate to success page with the link_id parameter
      window.location.href = `/payment/success?link_id=${linkId}&payment_id=${data ? data[0].id : 'unknown'}`;
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
