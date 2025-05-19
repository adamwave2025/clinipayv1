
import { useState, useCallback } from 'react';
import { useStripePayment } from '@/modules/payment/hooks/useStripePayment';
import { usePaymentIntent } from '@/hooks/usePaymentIntent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { PlanPaymentMetrics } from '@/services/plan-status/PlanPaymentMetrics';

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
    console.log('Card completion status at payment submission:', isCardComplete);
    if (!isCardComplete) {
      console.error('Card details are incomplete');
      toast.error('Please complete your card details');
      return { success: false, error: 'Card details are incomplete' };
    }
    
    // Check if Stripe is ready
    if (!processPayment) {
      console.error('Stripe payment system is not ready');
      toast.error('Payment system is not ready');
      setIsStripeReady(false);
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
          payment_request_id,
          payment_number,
          total_payments,
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
      
      // 5. If the payment is successful, update the status immediately in the database
      // This is a fallback in case the webhook doesn't trigger immediately
      try {
        console.log('Payment succeeded, updating database status as fallback to webhook');
        
        // Update payment_schedule record
        const { error: scheduleUpdateError } = await supabase
          .from('payment_schedule')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId);
          
        if (scheduleUpdateError) {
          console.error('Error updating payment schedule:', scheduleUpdateError);
          // Non-critical error, continue
        } else {
          console.log('Successfully updated payment schedule status to paid');
        }
        
        // If there's a payment_request_id, update that too
        if (paymentData.payment_request_id) {
          const { error: requestUpdateError } = await supabase
            .from('payment_requests')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString()
            })
            .eq('id', paymentData.payment_request_id);
            
          if (requestUpdateError) {
            console.error('Error updating payment request:', requestUpdateError);
            // Non-critical error, continue
          } else {
            console.log('Successfully updated payment request status to paid');
          }
        }
        
        // MODIFIED: Get accurate count of paid installments by querying the database
        // instead of incrementing a counter
        const { count: paidInstallments, error: countError } = await supabase
          .from('payment_schedule')
          .select('id', { count: 'exact', head: true })
          .eq('plan_id', paymentData.plan_id)
          .eq('status', 'paid');
        
        if (countError) {
          console.error('Error counting paid installments:', countError);
          // Continue with fallback method if counting fails
        } else {
          // Get current plan data
          const { data: planData, error: planFetchError } = await supabase
            .from('plans')
            .select('total_installments')
            .eq('id', paymentData.plan_id)
            .single();
            
          if (!planFetchError && planData) {
            // Update plan data
            const progress = Math.round((paidInstallments / planData.total_installments) * 100);
            const isCompleted = paidInstallments >= planData.total_installments;
            
            const { error: planUpdateError } = await supabase
              .from('plans')
              .update({
                paid_installments: paidInstallments,
                progress: progress,
                status: isCompleted ? 'completed' : 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', paymentData.plan_id);
              
            if (planUpdateError) {
              console.error('Error updating plan data:', planUpdateError);
              // Non-critical error, continue
            } else {
              console.log('Successfully updated plan data with accurate paid count');
            }
            
            // If not completed, find next due date
            if (!isCompleted) {
              const { data: nextPayment, error: nextPaymentError } = await supabase
                .from('payment_schedule')
                .select('due_date')
                .eq('plan_id', paymentData.plan_id)
                .eq('status', 'pending')
                .order('due_date', { ascending: true })
                .limit(1)
                .single();
                
              if (!nextPaymentError && nextPayment) {
                await supabase
                  .from('plans')
                  .update({
                    next_due_date: nextPayment.due_date
                  })
                  .eq('id', paymentData.plan_id);
                  
                console.log('Successfully updated next due date to', nextPayment.due_date);
              }
            }
          }
        }

        // 6. NEW: Log payment activity to the payment_activity table
        // This ensures activity is logged regardless of webhook timing
        await PlanPaymentMetrics.logPaymentActivity(
          paymentData.plans.payment_link_id,
          paymentData.plans.patient_id,
          paymentData.plans.clinic_id,
          paymentData.plan_id,
          'card_payment_processed',
          {
            payment_id: paymentId,
            amount: amount,
            payment_number: paymentData.payment_number,
            total_payments: paymentData.total_payments,
            processed_at: new Date().toISOString(),
            payment_method: 'card',
            stripe_payment_id: paymentResult.paymentIntent?.id || 'unknown'
          }
        );
        
        // 7. Use the PlanPaymentMetrics service to ensure the count is accurate
        await PlanPaymentMetrics.updatePlanPaymentMetrics(paymentData.plan_id);
        
      } catch (dbUpdateError: any) {
        console.error('Error in direct database update fallback:', dbUpdateError.message);
        // This is a fallback, so we continue even if it fails
      }
      
      toast.success('Payment processed successfully');
      
      // Refresh the payment data
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
