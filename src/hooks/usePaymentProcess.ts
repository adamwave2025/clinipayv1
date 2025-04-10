
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
    
    // Check if the clinic has payment processing set up
    if (linkData.clinic.stripeStatus !== 'connected') {
      toast.error('This clinic does not have payment processing set up');
      return;
    }
    
    setIsSubmitting(true);
    setProcessingPayment(true);
    
    try {
      console.log('Initiating payment process for link ID:', linkId);
      console.log('Payment amount:', linkData.amount);
      console.log('Form data:', formData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock payment record in the database
      const { data, error } = await supabase
        .from('payments')
        .insert({
          clinic_id: linkData.clinic.id,
          payment_link_id: linkData.isRequest ? null : linkData.id,
          reference: linkData.isRequest ? `Request-${linkData.id}` : null,
          patient_name: formData.name,
          patient_email: formData.email,
          patient_phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
          status: 'paid',
          amount_paid: linkData.amount,
          paid_at: new Date().toISOString(),
          stripe_payment_id: `mock_payment_${Date.now()}`
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
