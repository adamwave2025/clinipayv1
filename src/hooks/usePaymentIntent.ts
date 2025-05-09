
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
      
      // IMPORTANT: Ensure we have a valid amount
      const amount = linkData.amount || 0;
      console.log('Payment details:', {
        amountInPence: amount,
        isRequest: linkData.isRequest ? 'Yes' : 'No',
        clinicId: linkData.clinic.id,
        paymentLinkId: linkData.id
      });
      
      // Add extra validation to ensure amount is never zero or negative
      if (!amount || amount <= 0) {
        console.error('Invalid zero or negative payment amount detected:', amount);
        toast.error('Invalid payment amount');
        return { success: false, error: 'Invalid payment amount (zero or negative)' };
      }
      
      // Validate the amount to catch potential errors
      if (!validatePenceAmount(amount, 'usePaymentIntent')) {
        console.error('Invalid payment amount detected:', amount);
        toast.error('Invalid payment amount');
        return { success: false, error: 'Invalid payment amount' };
      }
      
      console.log('Calling create-payment-intent edge function with amount:', amount);
      
      // Call the create-payment-intent edge function with the CORRECT amount
      // CRITICAL: The amount is already in cents, DO NOT multiply by 100 again
      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke(
        'create-payment-intent', 
        {
          body: JSON.stringify({
            amount: amount, // Already in cents for Stripe
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
      
      console.log('Payment intent response:', paymentIntentData);
      
      if (!paymentIntentData) {
        console.error('No data returned from create-payment-intent');
        toast.error('Payment processing failed - No data returned');
        throw new Error('No data returned from create-payment-intent');
      }
      
      if (!paymentIntentData.success || !paymentIntentData.clientSecret) {
        console.error('Payment intent unsuccessful:', paymentIntentData);
        toast.error(paymentIntentData.error || 'Payment processing failed');
        throw new Error(paymentIntentData.error || 'Payment processing failed');
      }
      
      console.log('Associated payment link ID:', paymentIntentData.paymentLinkId);
      // Success! Return the data
      
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
