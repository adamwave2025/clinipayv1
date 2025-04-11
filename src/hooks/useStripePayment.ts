
import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

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
        throw new Error(stripeError.message || 'Payment failed');
      }
      
      if (!paymentIntent) {
        throw new Error('No payment intent returned');
      }
      
      if (paymentIntent.status === 'requires_payment_method' || 
          paymentIntent.status === 'requires_action' ||
          paymentIntent.status === 'canceled' ||
          paymentIntent.status === 'failed') {
        console.error('Payment intent status indicates failure:', paymentIntent.status);
        throw new Error(`Payment failed: ${paymentIntent.status}`);
      }
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }

      return { 
        success: true, 
        paymentIntent,
      };
    } catch (error: any) {
      console.error('Stripe payment processing error:', error);
      return { 
        success: false, 
        error: error.message || 'Error processing payment',
        paymentStatus: error.paymentIntent?.status
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processPayment
  };
}
