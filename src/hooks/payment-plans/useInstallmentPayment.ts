
import { useState, useCallback } from 'react';
import { useStripePayment } from '@/modules/payment/hooks/useStripePayment';
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
  
  // Get Stripe payment processors - these will return undefined/null if Stripe isn't ready
  const { processPayment, isProcessing } = useStripePayment();
  const { createPaymentIntent, isCreatingIntent } = usePaymentIntent();

  const handlePaymentSubmit = useCallback(async (
    formData: PaymentFormValues, 
    isCardComplete: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    // Enhanced validation for payment ID
    if (!paymentId) {
      console.error('Payment ID is required but was not provided');
      toast.error('Payment ID is required');
      return { success: false, error: 'Payment ID is required' };
    }
    
    // Validate payment ID format
    if (typeof paymentId !== 'string' || paymentId.trim() === '') {
      console.error('Invalid payment ID format:', paymentId);
      toast.error('Invalid payment ID format');
      return { success: false, error: 'Invalid payment ID format' };
    }
    
    // Validate card completion
    if (!isCardComplete) {
      console.error('Card details are incomplete');
      toast.error('Please complete your card details');
      return { success: false, error: 'Card details are incomplete' };
    }
    
    // Check if Stripe is ready
    if (!processPayment) {
      console.error('Stripe payment system is not ready');
      toast.error('Payment system is not ready');
      return { success: false, error: 'Payment system is not ready' };
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
      
      console.log('Retrieved payment schedule data:', paymentData);
      
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
        status: 'active', // Add the required status property
        clinic: {
          id: clinicData.id,
          name: clinicData.clinic_name,
          stripeStatus: clinicData.stripe_status
        },
        isRequest: false
      };
      
      console.log('Creating payment intent with data:', {
        linkId: paymentLinkData.id,
        amount: paymentLinkData.amount,
        payment_schedule_id: paymentId,
        planId: paymentData.plan_id
      });
      
      const intentResult = await createPaymentIntent({
        linkData: paymentLinkData,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        },
        // Pass payment_schedule_id to include in metadata - this is critical!
        payment_schedule_id: paymentId,
        planId: paymentData.plan_id,
        planStatus: paymentData.plans.status
      });
      
      if (!intentResult.success) {
        console.error('Failed to create payment intent:', intentResult.error);
        return { success: false, error: intentResult.error || 'Failed to create payment intent' };
      }
      
      console.log('Payment intent created successfully, proceeding with card payment');
      
      // 4. Process the payment with Stripe
      // Use the confirmed card completion state passed from the component
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
  }, [paymentId, amount, processPayment, createPaymentIntent, onPaymentProcessed]);

  return {
    isProcessing: isProcessing || isCreatingIntent,
    isLoading,
    isStripeReady,
    handlePaymentSubmit
  };
}
