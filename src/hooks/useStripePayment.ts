
import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useStripePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const processPayment = async ({
    clientSecret,
    formData,
    paymentAttemptId
  }: {
    clientSecret: string;
    formData: {
      name: string;
      email: string;
      phone?: string;
    };
    paymentAttemptId?: string;
  }) => {
    if (!stripe || !elements) {
      toast.error('Stripe has not been initialized');
      return { success: false, error: 'Stripe not initialized' };
    }

    const cardElement = elements.getElement('card');
    if (!cardElement) {
      toast.error('Card information is not complete');
      return { success: false, error: 'Card information incomplete' };
    }

    setIsProcessing(true);
    
    try {
      // Confirm the card payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret, 
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
            await updatePaymentAttemptStatus(paymentAttemptId, 'failed');
          } catch (updateError) {
            console.error('Failed to update payment attempt status:', updateError);
          }
        }
        
        throw new Error(stripeError.message || 'Payment failed');
      }
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
      
      // Update payment attempt status if we have an attempt ID
      if (paymentAttemptId) {
        try {
          await updatePaymentAttemptStatus(paymentAttemptId, 'succeeded');
        } catch (updateError) {
          console.error('Failed to update payment attempt status:', updateError);
        }
      }

      return { 
        success: true, 
        paymentIntent,
      };
    } catch (error: any) {
      console.error('Stripe payment processing error:', error);
      return { 
        success: false, 
        error: error.message || 'Error processing payment' 
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePaymentAttemptStatus = async (attemptId: string, status: string) => {
    try {
      await supabase.functions.invoke('update-payment-status', {
        body: JSON.stringify({
          attemptId,
          status
        })
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to update payment attempt status:', error);
        }
      });
    } catch (error) {
      console.error('Error updating payment attempt status:', error);
    }
  };

  return {
    isProcessing,
    processPayment
  };
}
