
import { useState, useRef, useCallback } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

export function useStripePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const stripe = useStripe();
  const elements = useElements();

  const processPayment = useCallback(async ({
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
    // Check if the Stripe library is initialized - log detailed error if not
    if (!stripe) {
      console.error('Stripe not initialized - processPayment failed');
      toast.error('Payment system is not initialized');
      return { success: false, error: 'Payment system not initialized' };
    }

    // Check if Elements are initialized - log detailed error if not
    if (!elements) {
      console.error('Stripe Elements not initialized - processPayment failed');
      toast.error('Payment form is not fully loaded');
      return { success: false, error: 'Payment form not fully loaded' };
    }

    const cardElement = elements.getElement('card');
    
    // Check if the card element is available - log detailed error if not
    if (!cardElement) {
      console.error('Card element not found or is not initialized');
      toast.error('Card information is not available');
      return { success: false, error: 'Card information unavailable' };
    }

    // Verify card element is available
    console.log('Card element available for payment processing', { 
      cardElementAvailable: !!cardElement,
      stripeReady: !!stripe,
      elementsReady: !!elements
    });

    // Prevent duplicate processing
    if (processingRef.current || isProcessing) {
      console.log('Payment processing already in progress');
      return { success: false, error: 'Payment already in progress' };
    }

    setIsProcessing(true);
    processingRef.current = true;
    
    try {
      console.log('Confirming card payment with Stripe...');
      
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

      console.log('Payment successful:', paymentIntent.id);
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
      processingRef.current = false;
    }
  }, [stripe, elements, isProcessing]);

  // Keep the rest of the component as is
  const processApplePayPayment = useCallback(async ({
    clientSecret,
    paymentMethod
  }: {
    clientSecret: string;
    paymentMethod: any;
  }) => {
    if (!stripe) {
      toast.error('Payment system is not initialized');
      return { success: false, error: 'Payment system not initialized' };
    }

    // Prevent duplicate processing
    if (processingRef.current || isProcessing) {
      console.log('Payment processing already in progress');
      return { success: false, error: 'Payment already in progress' };
    }

    setIsProcessing(true);
    processingRef.current = true;
    
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
      processingRef.current = false;
    }
  }, [stripe, isProcessing]);

  return {
    isProcessing,
    processPayment,
    processApplePayPayment
  };
}
