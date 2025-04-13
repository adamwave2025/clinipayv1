
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaymentLinkData } from './usePaymentLinkData';

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
      return { success: false, error: 'Payment details are missing' };
    }
    
    // Check if the clinic has Stripe connected before attempting payment
    if (linkData.clinic.stripeStatus !== 'connected') {
      return { success: false, error: 'This clinic does not have payment processing set up' };
    }

    setIsCreatingIntent(true);
    
    try {
      console.log('Initiating payment process for link ID:', linkData.id);
      console.log('Payment amount:', linkData.amount);
      console.log('Is request payment:', linkData.isRequest ? 'Yes' : 'No');
      
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
      
      console.log('Associated payment link ID:', paymentIntentData.paymentLinkId);
      
      return {
        success: true,
        clientSecret: paymentIntentData.clientSecret,
        associatedPaymentLinkId: paymentIntentData.paymentLinkId
      };
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      return { success: false, error: error.message };
    } finally {
      setIsCreatingIntent(false);
    }
  };

  return {
    isCreatingIntent,
    createPaymentIntent
  };
}
