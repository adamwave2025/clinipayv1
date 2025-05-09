
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaymentLinkData } from './usePaymentLinkData';
import { validatePenceAmount } from '@/services/CurrencyService';
import { toast } from 'sonner';

export function usePaymentIntent() {
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  const createPaymentIntent = async ({
    linkData,
    formData
  }: {
    linkData: PaymentLinkData;
    formData: {
      name: string;
      email: string;
      phone?: string;
    };
  }) => {
    if (!linkData) {
      toast.error('Payment details are missing');
      return { success: false, error: 'Payment details are missing' };
    }
    
    // Check if the clinic has Stripe connected before attempting payment
    if (linkData.clinic.stripeStatus !== 'connected') {
      toast.error('This clinic does not have payment processing set up');
      return { success: false, error: 'This clinic does not have payment processing set up' };
    }

    setIsCreatingIntent(true);
    
    try {
      console.log('Initiating payment process for link ID:', linkData.id);
      
      // IMPORTANT: linkData.amount is already in pence (cents) from the database
      // Log full details to aid debugging
      console.log('Payment details:', {
        amountInPence: linkData.amount,
        isRequest: linkData.isRequest ? 'Yes' : 'No',
        clinicId: linkData.clinic.id,
        paymentLinkId: linkData.id
      });
      
      // Validate the amount to catch potential errors
      if (!validatePenceAmount(linkData.amount, 'usePaymentIntent')) {
        console.error('Invalid payment amount detected:', linkData.amount);
        toast.error('Invalid payment amount');
        return { success: false, error: 'Invalid payment amount' };
      }
      
      // Call the create-payment-intent edge function with the CORRECT amount
      // CRITICAL: The amount is already in cents, DO NOT multiply by 100 again
      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke(
        'create-payment-intent', 
        {
          body: JSON.stringify({
            amount: linkData.amount, // Already in cents for Stripe
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
        toast.error(paymentIntentError.message || 'Error creating payment intent');
        throw new Error(paymentIntentError.message || 'Error creating payment intent');
      }
      
      if (!paymentIntentData.success || !paymentIntentData.clientSecret) {
        console.error('Payment intent unsuccessful:', paymentIntentData);
        toast.error(paymentIntentData.error || 'Payment processing failed');
        throw new Error(paymentIntentData.error || 'Payment processing failed');
      }
      
      console.log('Associated payment link ID:', paymentIntentData.paymentLinkId);
      // Removed success toast notification
      
      return {
        success: true,
        clientSecret: paymentIntentData.clientSecret,
        associatedPaymentLinkId: paymentIntentData.paymentLinkId
      };
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      toast.error(error.message || 'Error processing payment');
      return { success: false, error: error.message || 'Unknown error occurred' };
    } finally {
      setIsCreatingIntent(false);
    }
  };

  return {
    isCreatingIntent,
    createPaymentIntent
  };
}
