
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePaymentRecord() {
  
  const createPaymentRecord = async ({
    paymentIntent,
    linkData,
    formData,
    paymentReference,
    associatedPaymentLinkId
  }: {
    paymentIntent: any;
    linkData: any;
    formData: {
      name: string;
      email: string;
      phone?: string;
    };
    paymentReference: string;
    associatedPaymentLinkId: string | null;
  }) => {
    try {
      console.log('Creating payment record in database');
      
      // Create a payment record in the database
      const { data, error } = await supabase
        .from('payments')
        .insert({
          clinic_id: linkData.clinic.id,
          payment_link_id: associatedPaymentLinkId || (linkData.isRequest ? null : linkData.id),
          patient_name: formData.name,
          patient_email: formData.email,
          patient_phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
          status: 'paid',
          amount_paid: linkData.amount,
          paid_at: new Date().toISOString(),
          stripe_payment_id: paymentIntent.id,
          payment_ref: paymentReference // Save the payment reference
        })
        .select();
      
      if (error) {
        console.error('Error creating payment record:', error);
        toast.error('Payment successful, but we could not create a payment record');
        return { success: false, error: error.message };
      }
      
      console.log('Payment record created successfully:', data);
      
      // If this was a payment request, update its status and paid_at
      if (linkData.isRequest && data && data.length > 0) {
        await updatePaymentRequest(linkData.id, data[0].id);
      }
      
      return { success: true, paymentId: data?.[0]?.id };
    } catch (error: any) {
      console.error('Error creating payment record:', error);
      return { success: false, error: error.message };
    }
  };

  const updatePaymentRequest = async (requestId: string, paymentId: string) => {
    console.log('Updating payment request status to paid');
    const { error: requestUpdateError } = await supabase
      .from('payment_requests')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_id: paymentId // Set the payment_id to link to the payment record
      })
      .eq('id', requestId);
      
    if (requestUpdateError) {
      console.error('Error updating payment request:', requestUpdateError);
      toast.error('Payment successful, but we could not update payment request status');
      return false;
    }
    
    console.log('Successfully updated payment request with payment_id:', paymentId);
    return true;
  };

  return {
    createPaymentRecord
  };
}
