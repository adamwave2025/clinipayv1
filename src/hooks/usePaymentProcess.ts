
import { useState, useRef } from 'react';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { toast } from 'sonner';
import { PaymentLinkData } from './usePaymentLinkData';
import { useStripePayment } from '@/modules/payment/hooks/useStripePayment';
import { usePaymentIntent } from './usePaymentIntent';
import { usePaymentRecord } from './usePaymentRecord';
import { isPaymentLinkActive } from '@/utils/planActivityUtils';

interface ApplePayFormData {
  name: string;
  email: string;
  phone?: string;
  paymentMethod: any;
}

export function usePaymentProcess(linkId: string | undefined, linkData: PaymentLinkData | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const processingRef = useRef(false); // Additional ref to prevent race conditions
  const navigatingRef = useRef(false); // Track if we're currently navigating
  
  const { isProcessing, processPayment, processApplePayPayment } = useStripePayment();
  const { isCreatingIntent, createPaymentIntent } = usePaymentIntent();
  const { createPaymentRecord } = usePaymentRecord();

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    if (!linkData) {
      toast.error('Payment details are missing');
      return;
    }
    
    // Triple protection against duplicate submissions with both state and ref
    if (isSubmitting || processingPayment || processingRef.current || navigatingRef.current) {
      console.log('Payment submission blocked - already in progress', {
        isSubmitting,
        processingPayment,
        processingRef: processingRef.current,
        navigatingRef: navigatingRef.current
      });
      return;
    }
    
    // Check if the payment link is still active before proceeding
    if (!isPaymentLinkActive(linkData)) {
      console.log('Payment link is no longer active, status:', linkData.status);
      // Show a message instead of reloading
      toast.error('This payment link is no longer active');
      return;
    }
    
    // Set both state and ref flags
    setIsSubmitting(true);
    processingRef.current = true;
    
    try {
      console.log('Starting payment submission with form data:', { 
        name: formData.name, 
        email: formData.email,
        hasPhone: !!formData.phone
      });
      
      // Step 1: Create payment intent
      console.log('Creating payment intent...');
      const intentResult = await createPaymentIntent({
        linkData,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }
      });
      
      console.log('Payment intent creation result:', intentResult.success);
      
      if (!intentResult.success) {
        // Check if the error is due to payment status issues
        const errorMessage = intentResult.error || 'Failed to create payment intent';
        console.error('Payment intent creation failed:', errorMessage);
        
        // If the error indicates the payment is already paid, cancelled, or plan is paused
        if (errorMessage.includes('already been processed') || 
            errorMessage.includes('has been cancelled') ||
            errorMessage.includes('plan is currently paused') ||
            errorMessage.includes('plan has been cancelled') ||
            errorMessage.includes('has been rescheduled')) {
          
          console.log('Payment status issue detected, showing toast instead of reloading');
          toast.error(errorMessage);
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      // Step 2: Now set processingPayment to true to show the overlay, but keep the form mounted
      setProcessingPayment(true);
      console.log('Processing payment with client secret:', intentResult.clientSecret ? 'Received' : 'Missing');
      
      // Step 3: Process the payment with Stripe
      console.log('Confirming payment with Stripe...');
      const paymentResult = await processPayment({
        clientSecret: intentResult.clientSecret,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }
      });
      
      console.log('Payment processing result:', paymentResult.success);
      
      if (!paymentResult.success) {
        console.error('Payment processing failed:', paymentResult.error);
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
      
      console.log('Payment processed successfully, recording payment...');
      
      // Step 4: Create client-side record
      const recordResult = await createPaymentRecord({
        paymentIntent: paymentResult.paymentIntent,
        linkData,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        },
        associatedPaymentLinkId: intentResult.associatedPaymentLinkId
      });
      
      console.log('Payment record created:', recordResult);
      
      // Safely navigate to success page - using window.location with manual control
      navigatingRef.current = true;
      
      // Show a success message before navigating
      toast.success('Payment successful! Redirecting to confirmation page...');
      
      // Use a small delay to ensure toast is seen
      console.log('Will navigate to success page in 1.5 seconds...');
      setTimeout(() => {
        const successUrl = `/payment/success?link_id=${linkId || ''}&payment_id=${paymentResult.paymentIntent.id || 'unknown'}`;
        console.log('Navigating to success page:', successUrl);
        window.location.href = successUrl;
      }, 1500);
      
    } catch (error: any) {
      console.error('Payment submission error:', error);
      toast.error('Payment failed: ' + error.message);
      
      // No automatic navigation on error - let the user retry or see the error
    } finally {
      // Reset state flags if we're not navigating away
      if (!navigatingRef.current) {
        console.log('Resetting payment submission flags');
        setIsSubmitting(false);
        setProcessingPayment(false);
        processingRef.current = false;
      }
    }
  };

  const handleApplePaySubmit = async (applePayData: ApplePayFormData) => {
    if (!linkData) {
      toast.error('Payment details are missing');
      return;
    }
    
    // Triple protection against duplicate submissions
    if (isSubmitting || processingPayment || processingRef.current || navigatingRef.current) {
      console.log('Apple Pay submission blocked - already in progress');
      return;
    }
    
    // Check if the payment link is still active before proceeding
    if (!isPaymentLinkActive(linkData)) {
      console.log('Payment link is no longer active, status:', linkData.status);
      toast.error('This payment link is no longer active');
      return;
    }
    
    setIsSubmitting(true);
    setProcessingPayment(true);
    processingRef.current = true;
    
    try {
      console.log('Creating payment intent for Apple Pay...');
      // Step 1: Create payment intent
      const intentResult = await createPaymentIntent({
        linkData,
        formData: {
          name: applePayData.name,
          email: applePayData.email,
          phone: applePayData.phone
        }
      });
      
      if (!intentResult.success) {
        // Check for specific error messages about plan status
        const errorMessage = intentResult.error || 'Failed to create payment intent';
        
        if (errorMessage.includes('plan is currently paused') || 
            errorMessage.includes('plan has been cancelled') ||
            errorMessage.includes('has been rescheduled')) {
          
          console.log('Plan status issue detected, showing toast instead of reloading');
          toast.error(errorMessage);
          return;
        }
        
        throw new Error(intentResult.error || 'Failed to create payment intent');
      }
      
      console.log('Processing Apple Pay payment...');
      // Step 2: Process the payment with Apple Pay
      const paymentResult = await processApplePayPayment({
        clientSecret: intentResult.clientSecret,
        paymentMethod: applePayData.paymentMethod
      });
      
      if (!paymentResult.success) {
        console.error('Apple Pay processing failed:', paymentResult.error);
        throw new Error(paymentResult.error || 'Apple Pay processing failed');
      }
      
      console.log('Recording Apple Pay payment...');
      // Step 3: Create client-side record
      await createPaymentRecord({
        paymentIntent: paymentResult.paymentIntent,
        linkData,
        formData: {
          name: applePayData.name,
          email: applePayData.email,
          phone: applePayData.phone
        },
        associatedPaymentLinkId: intentResult.associatedPaymentLinkId
      });
      
      // Safely navigate to success page with manual control
      navigatingRef.current = true;
      
      toast.success('Apple Pay payment successful! Redirecting to confirmation page...');
      
      setTimeout(() => {
        const successUrl = `/payment/success?link_id=${linkId || ''}&payment_id=${paymentResult.paymentIntent.id || 'unknown'}`;
        console.log('Navigating to success page:', successUrl);
        window.location.href = successUrl;
      }, 1500);
      
    } catch (error: any) {
      console.error('Apple Pay error:', error);
      toast.error('Apple Pay payment failed: ' + error.message);
      
      // No automatic navigation on error
    } finally {
      // Reset state flags if we're not navigating away
      if (!navigatingRef.current) {
        setIsSubmitting(false);
        setProcessingPayment(false);
        processingRef.current = false;
      }
    }
  };

  return {
    isSubmitting: isSubmitting || isCreatingIntent || isProcessing,
    processingPayment,
    handlePaymentSubmit,
    handleApplePaySubmit
  };
}
