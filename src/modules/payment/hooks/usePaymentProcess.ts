import { useState } from 'react';
import { PaymentFormValues } from '../components/form/FormSchema';
import { toast } from 'sonner';
import { PaymentLinkData } from '../types/paymentLink';
import { useStripePayment } from './useStripePayment';
import { usePaymentIntent } from './usePaymentIntent';
import { usePaymentRecord } from './usePaymentRecord';
import { isPaymentLinkActive } from '../utils/planActivityUtils';

interface ApplePayFormData {
  name: string;
  email: string;
  phone?: string;
  paymentMethod: any;
}

export function usePaymentProcess(linkId: string | undefined, linkData: PaymentLinkData | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const { isProcessing, processPayment, processApplePayPayment } = useStripePayment();
  const { isCreatingIntent, createPaymentIntent } = usePaymentIntent();
  const { createPaymentRecord } = usePaymentRecord();

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    if (!linkData) {
      toast.error('Payment details are missing');
      return;
    }
    
    // Check if the payment link is still active before proceeding
    // Using the updated isPaymentLinkActive function that accepts PaymentLinkData
    if (!isPaymentLinkActive(linkData)) {
      console.log('Payment link is no longer active:', { 
        status: linkData.status,
        isActive: linkData.isActive,
        id: linkData.id
      });
      
      // Show a toast instead of reloading the page
      toast.error('This payment link is no longer active');
      return;
    }
    
    // Set isSubmitting to true to disable form inputs
    setIsSubmitting(true);
    
    try {
      // Step 1: Create payment intent
      const intentResult = await createPaymentIntent({
        linkData,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }
      });
      
      if (!intentResult.success) {
        // Check if the error is due to payment status issues
        const errorMessage = intentResult.error || 'Failed to create payment intent';
        
        // If the error indicates the payment is already paid, cancelled, or plan is paused
        if (errorMessage.includes('already been processed') || 
            errorMessage.includes('has been cancelled') ||
            errorMessage.includes('plan is currently paused') ||
            errorMessage.includes('plan has been cancelled') ||
            errorMessage.includes('has been rescheduled')) {
          
          console.log('Payment status issue detected:', errorMessage);
          toast.error(errorMessage);
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      // Step 2: Now set processingPayment to true to show the overlay, but keep the form mounted
      setProcessingPayment(true);
      
      // Step 3: Process the payment with Stripe
      const paymentResult = await processPayment({
        clientSecret: intentResult.clientSecret,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }
      });
      
      if (!paymentResult.success) {
        console.error('Payment processing failed:', paymentResult.error);
        // Show error toast instead of redirecting to failed page
        toast.error(paymentResult.error || 'Payment processing failed');
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
      
      // Step 4: Create client-side record and update UI (webhook handles DB updates)
      await createPaymentRecord({
        paymentIntent: paymentResult.paymentIntent,
        linkData,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        },
        associatedPaymentLinkId: intentResult.associatedPaymentLinkId
      });
      
      // Show success toast before redirect
      toast.success('Payment successful!');
      
      // Navigate to success page with the link_id parameter
      window.location.href = `/payment/success?link_id=${linkId}&payment_id=${paymentResult.paymentIntent.id || 'unknown'}`;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
      setProcessingPayment(false);
    }
  };

  const handleApplePaySubmit = async (applePayData: ApplePayFormData) => {
    if (!linkData) {
      toast.error('Payment details are missing');
      return;
    }
    
    // Check if the payment link is still active before proceeding
    // Using the updated isPaymentLinkActive function that accepts PaymentLinkData
    if (!isPaymentLinkActive(linkData)) {
      console.log('Payment link is no longer active:', { 
        status: linkData.status,
        isActive: linkData.isActive,
        id: linkData.id
      });
      
      // Show a toast instead of reloading the page
      toast.error('This payment link is no longer active');
      return;
    }
    
    setIsSubmitting(true);
    setProcessingPayment(true);
    
    try {
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
          
          console.log('Plan status issue detected:', errorMessage);
          toast.error(errorMessage);
          return;
        }
        
        throw new Error(intentResult.error || 'Failed to create payment intent');
      }
      
      // Step 2: Process the payment with Apple Pay
      const paymentResult = await processApplePayPayment({
        clientSecret: intentResult.clientSecret,
        paymentMethod: applePayData.paymentMethod
      });
      
      if (!paymentResult.success) {
        console.error('Apple Pay processing failed:', paymentResult.error);
        toast.error(paymentResult.error || 'Apple Pay processing failed');
        throw new Error(paymentResult.error || 'Apple Pay processing failed');
      }
      
      // Step 3: Create client-side record and update UI
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
      
      // Show success toast before redirect
      toast.success('Apple Pay payment successful!');
      
      // Navigate to success page
      window.location.href = `/payment/success?link_id=${linkId}&payment_id=${paymentResult.paymentIntent.id || 'unknown'}`;
    } catch (error: any) {
      console.error('Apple Pay error:', error);
      toast.error('Apple Pay payment failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
      setProcessingPayment(false);
    }
  };

  return {
    isSubmitting: isSubmitting || isCreatingIntent || isProcessing,
    processingPayment,
    handlePaymentSubmit,
    handleApplePaySubmit
  };
}
