
import { useState } from 'react';
import { useStripePayment } from '@/hooks/useStripePayment';
import { usePaymentIntent } from '@/hooks/usePaymentIntent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';

export function useInstallmentPayment(
  paymentId: string | null,
  amount: number,
  onPaymentProcessed: () => Promise<void>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState(true);
  
  const { processPayment, isProcessing } = useStripePayment();
  const { createPaymentIntent, isCreatingIntent } = usePaymentIntent();

  const handlePaymentSubmit = async (formData: PaymentFormValues): Promise<{ success: boolean; error?: string }> => {
    if (!paymentId) {
      toast.error('Payment ID is required');
      return { success: false, error: 'Payment ID is required' };
    }
    
    setIsLoading(true);
    
    try {
      console.log('Handling installment payment for payment ID:', paymentId);
      
      // 1. Get payment and plan details from the database
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_schedule')
        .select(`
          id,
          plan_id,
          amount,
          status,
          due_date,
          plans!inner(
            id,
            clinic_id,
            patient_id,
            title,
            status,
            payment_link_id
          )
        `)
        .eq('id', paymentId)
        .single();
      
      if (paymentError || !paymentData) {
        console.error('Error fetching payment details:', paymentError);
        toast.error('Could not retrieve payment details');
        return { success: false, error: 'Could not retrieve payment details' };
      }
      
      // 2. Get clinic details
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('id, clinic_name, stripe_account_id, stripe_status')
        .eq('id', paymentData.plans.clinic_id)
        .single();
      
      if (clinicError || !clinicData) {
        console.error('Error fetching clinic details:', clinicError);
        toast.error('Could not retrieve clinic details');
        return { success: false, error: 'Could not retrieve clinic details' };
      }
      
      if (clinicData.stripe_status !== 'connected') {
        toast.error('This clinic does not have payment processing set up');
        return { success: false, error: 'Clinic payment processing not configured' };
      }
      
      // 3. Create payment intent
      const paymentLinkData = {
        id: paymentData.plans.payment_link_id,
        amount: amount, // Use the amount provided from the payment schedule
        clinic: {
          id: clinicData.id,
          name: clinicData.clinic_name,
          stripeStatus: clinicData.stripe_status
        },
        isRequest: false
      };
      
      const intentResult = await createPaymentIntent({
        linkData: paymentLinkData,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }
      });
      
      if (!intentResult.success) {
        console.error('Failed to create payment intent:', intentResult.error);
        return { success: false, error: intentResult.error || 'Failed to create payment intent' };
      }
      
      // 4. Process the payment with Stripe
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
        return { success: false, error: paymentResult.error || 'Payment processing failed' };
      }
      
      // 5. The webhook will handle updating the payment status, but we'll show success to the user
      toast.success('Payment processed successfully');
      
      // 6. Refresh the payment data
      await onPaymentProcessed();
      
      return { success: true };
      
    } catch (error: any) {
      console.error('Error processing installment payment:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isProcessing: isProcessing || isCreatingIntent,
    isLoading,
    isStripeReady,
    handlePaymentSubmit
  };
}
