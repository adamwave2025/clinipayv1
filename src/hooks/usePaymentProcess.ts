
import { useState } from 'react';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentLinkData } from './usePaymentLinkData';

export function usePaymentProcess(linkId: string | undefined, linkData: PaymentLinkData | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    if (!linkData) {
      toast.error('Payment details are missing');
      return;
    }
    
    // Check if the clinic has Stripe connected before attempting payment
    if (linkData.clinic.stripeStatus !== 'connected') {
      toast.error('This clinic does not have payment processing set up');
      return;
    }
    
    setIsSubmitting(true);
    setProcessingPayment(true);
    
    try {
      console.log('Initiating payment process for link ID:', linkId);
      console.log('Payment amount:', linkData.amount);
      
      // Call the create-payment-intent edge function to get a client secret
      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke(
        'create-payment-intent', 
        {
          body: JSON.stringify({
            amount: Math.round(linkData.amount * 100), // Convert to cents for Stripe
            clinicId: linkData.clinic.id,
            paymentLinkId: linkData.isRequest ? null : linkData.id,
            requestId: linkData.isRequest ? linkData.id : null,
            // Add mock card data from form
            paymentMethod: {
              card: {
                number: formData.cardNumber.replace(/\s/g, ''),
                exp_month: parseInt(formData.cardExpiry.split('/')[0]),
                exp_year: parseInt(`20${formData.cardExpiry.split('/')[1]}`),
                cvc: formData.cardCvc
              },
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
      
      if (!paymentIntentData.success) {
        console.error('Payment intent unsuccessful:', paymentIntentData);
        throw new Error(paymentIntentData.error || 'Payment processing failed');
      }
      
      console.log('Payment successful, creating payment record in database');
      
      // Create a payment record in the database - removed payment_request_id field
      // and added reference field for payment requests
      const { data, error } = await supabase
        .from('payments')
        .insert({
          clinic_id: linkData.clinic.id,
          payment_link_id: linkData.isRequest ? null : linkData.id,
          reference: linkData.isRequest ? `Request-${linkData.id}` : null, // Store request ID in reference field
          patient_name: formData.name,
          patient_email: formData.email,
          patient_phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
          status: 'paid',
          amount_paid: linkData.amount,
          paid_at: new Date().toISOString(),
          stripe_payment_id: paymentIntentData.paymentId
        })
        .select();
      
      if (error) {
        console.error('Error creating payment record:', error);
        throw error;
      }
      
      console.log('Payment record created successfully:', data);

      // If this was a payment request, update its status and paid_at
      if (linkData.isRequest) {
        console.log('Updating payment request status to paid');
        const { error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_id: data[0].id
          })
          .eq('id', linkData.id);
          
        if (requestUpdateError) {
          console.warn('Warning: Could not update payment request status:', requestUpdateError);
        }
      }
      
      toast.success('Payment successful!');
      
      // Navigate to success page with the link_id parameter
      window.location.href = `/payment/success?link_id=${linkId}&payment_id=${data[0].id}`;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
      setProcessingPayment(false);
    }
  };

  return {
    isSubmitting,
    processingPayment,
    handlePaymentSubmit,
  };
}
