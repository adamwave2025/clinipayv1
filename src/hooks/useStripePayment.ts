import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

export function useStripePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const processPayment = async ({
    clientSecret,
    formData
  }: {
    clientSecret: string;
    formData: {
      name: string;
      email: string;
      phone?: string;
    };
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
      
      // Fix: Use a type-safe comparison by explicitly checking each failed status
      if (paymentIntent.status === 'requires_payment_method' || 
          paymentIntent.status === 'requires_action' ||
          paymentIntent.status === 'canceled') {
        console.error('Payment intent status indicates failure:', paymentIntent.status);
        throw new Error(`Payment failed: ${paymentIntent.status}`);
      }
      
      // Check if the payment was successful
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

  const processApplePayPayment = async ({
    clientSecret,
    paymentMethod
  }: {
    clientSecret: string;
    paymentMethod: any;
  }) => {
    if (!stripe) {
      toast.error('Stripe has not been initialized');
      return { success: false, error: 'Stripe not initialized' };
    }

    setIsProcessing(true);
    
    try {
      // Confirm the payment with the payment method from Apple Pay
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethod.id
        }
      );
      
      if (stripeError) {
        console.error('Apple Pay payment error:', stripeError);
        throw new Error(stripeError.message || 'Apple Pay payment failed');
      }
      
      if (!paymentIntent) {
        throw new Error('No payment intent returned');
      }
      
      if (paymentIntent.status === 'requires_payment_method' || 
          paymentIntent.status === 'requires_action' ||
          paymentIntent.status === 'canceled') {
        console.error('Payment intent status indicates failure:', paymentIntent.status);
        throw new Error(`Apple Pay payment failed: ${paymentIntent.status}`);
      }
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Apple Pay payment status: ${paymentIntent.status}`);
      }

      return { 
        success: true, 
        paymentIntent,
      };
    } catch (error: any) {
      console.error('Apple Pay processing error:', error);
      return { 
        success: false, 
        error: error.message || 'Error processing Apple Pay payment',
        paymentStatus: error.paymentIntent?.status
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processPayment,
    processApplePayPayment
  };
}
