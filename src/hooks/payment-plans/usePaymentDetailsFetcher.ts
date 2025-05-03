
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types/payment';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

export const usePaymentDetailsFetcher = () => {
  const [paymentData, setPaymentData] = useState<Payment | null>(null);

  const fetchPaymentDataForInstallment = async (installment: PlanInstallment) => {
    try {
      if (!installment.paymentRequestId) {
        toast.error('No payment information available');
        return null;
      }

      // First get the payment_id from the payment request
      const { data: requestData, error: requestError } = await supabase
        .from('payment_requests')
        .select('payment_id')
        .eq('id', installment.paymentRequestId)
        .single();

      if (requestError || !requestData.payment_id) {
        console.error('Error fetching payment request:', requestError);
        toast.error('Failed to fetch payment information');
        return null;
      }

      // Now fetch the actual payment data
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select(`
          id,
          amount_paid,
          paid_at,
          patient_name,
          patient_email,
          patient_phone,
          payment_ref,
          status,
          payment_link_id,
          payment_links (
            title,
            type,
            description
          )
        `)
        .eq('id', requestData.payment_id)
        .single();

      if (paymentError) {
        console.error('Error fetching payment data:', paymentError);
        toast.error('Failed to fetch payment details');
        return null;
      }

      // Format the payment data
      const formattedPayment: Payment = {
        id: paymentData.id,
        patientName: paymentData.patient_name || 'Unknown',
        patientEmail: paymentData.patient_email,
        patientPhone: paymentData.patient_phone,
        amount: paymentData.amount_paid || 0,
        date: new Date(paymentData.paid_at).toLocaleDateString(),
        status: paymentData.status as any || 'paid',
        type: 'payment_plan',
        reference: paymentData.payment_ref,
        linkTitle: paymentData.payment_links?.title || 'Payment Plan Installment'
      };
      
      setPaymentData(formattedPayment);
      return formattedPayment;
    } catch (error) {
      console.error('Error in fetchPaymentDataForInstallment:', error);
      toast.error('An error occurred while fetching payment details');
      return null;
    }
  };

  return {
    paymentData,
    setPaymentData,
    fetchPaymentDataForInstallment
  };
};
