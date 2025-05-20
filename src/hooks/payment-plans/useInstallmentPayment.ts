
import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FormData = {
  name: string;
  email: string;
  phone?: string;
  stripeCard?: { complete: boolean };
};

export function useInstallmentPayment(
  paymentId: string,
  amount: number,
  onSuccessCallback?: () => Promise<void>
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const isStripeReady = !!stripe && !!elements;

  const handlePaymentSubmit = async (formData: FormData, isCardComplete: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!stripe || !elements || !paymentId) {
      return { success: false, error: 'Payment system not ready' };
    }

    if (!isCardComplete) {
      return { success: false, error: 'Please complete card details' };
    }

    setIsProcessing(true);
    setIsLoading(true);

    try {
      console.log('Creating payment intent for installment payment:', paymentId);

      // Get the payment details from the payment schedule
      const { data: paymentSchedule, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('*, plans:plan_id(*)')
        .eq('id', paymentId)
        .single();

      if (fetchError || !paymentSchedule) {
        throw new Error(fetchError?.message || 'Payment information not found');
      }

      const planData = paymentSchedule.plans;
      
      // Create payment intent
      const { data: intentData, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
        body: JSON.stringify({
          amount: amount,
          clinicId: paymentSchedule.clinic_id,
          paymentLinkId: paymentSchedule.payment_link_id,
          payment_schedule_id: paymentId,
          planId: paymentSchedule.plan_id,
          planStatus: planData?.status,
          paymentMethod: {
            billing_details: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone || undefined
            }
          }
        })
      });

      if (intentError || !intentData?.clientSecret) {
        throw new Error(intentError?.message || intentData?.error || 'Failed to create payment intent');
      }

      // Confirm card payment
      const cardElement = elements.getElement('card');
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
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

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // Update payment schedule status
        const { error: updateError } = await supabase
          .from('payment_schedule')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId);

        if (updateError) {
          console.error('Error updating payment schedule status:', updateError);
          // Continue execution even if update fails
        }
        
        // Ensure the payment is recorded in the payments table
        // Note: The webhook should handle this, but we'll add a fallback
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_payment_id', paymentIntent.id)
          .maybeSingle();
          
        if (!existingPayment) {
          console.log('Creating fallback payment record for payment intent:', paymentIntent.id);
          
          // Create a payment record as fallback
          const { error: recordError } = await supabase
            .from('payments')
            .insert({
              clinic_id: paymentSchedule.clinic_id,
              payment_link_id: paymentSchedule.payment_link_id,
              patient_id: paymentSchedule.patient_id,
              patient_name: formData.name,
              patient_email: formData.email,
              patient_phone: formData.phone,
              amount_paid: amount,
              status: 'paid',
              paid_at: new Date().toISOString(),
              stripe_payment_id: paymentIntent.id,
              payment_ref: paymentIntent.metadata?.paymentReference || 
                `CLP${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}`,
              payment_schedule_id: paymentId
            });
            
          if (recordError) {
            console.error('Error creating fallback payment record:', recordError);
            // Continue execution even if record creation fails
          }
        }

        // Call success callback if provided
        if (onSuccessCallback) {
          await onSuccessCallback();
        }

        toast.success('Payment successful');
        return { success: true };
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent?.status || 'unknown'}`);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast.error(error.message || 'Payment processing failed');
      return { success: false, error: error.message || 'An unknown error occurred' };
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  return {
    isProcessing,
    isLoading,
    isStripeReady,
    handlePaymentSubmit
  };
}
