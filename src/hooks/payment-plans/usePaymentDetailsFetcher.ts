
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

export const usePaymentDetailsFetcher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any | null>(null);

  const fetchPaymentDetails = async (installment: PlanInstallment) => {
    setIsLoading(true);
    
    try {
      // If there is no payment request ID, we can't fetch payment details
      if (!installment.paymentRequestId) {
        console.log('No payment request ID found for this installment');
        toast.error('No payment information available');
        return null;
      }
      
      console.log('Fetching payment details for request ID:', installment.paymentRequestId);
      
      // First get the payment request details
      const { data: requestData, error: requestError } = await supabase
        .from('payment_requests')
        .select(`
          id, payment_id, patient_name, patient_email, patient_phone,
          payments (
            id, amount_paid, status, paid_at, payment_ref, 
            stripe_payment_id, refund_amount, refunded_at
          )
        `)
        .eq('id', installment.paymentRequestId)
        .single();
      
      if (requestError) {
        console.error('Error fetching payment request:', requestError);
        toast.error('Failed to load payment details');
        return null;
      }
      
      console.log('Payment request data:', requestData);
      
      // Extract payment information from the request
      const paymentInfo = requestData.payments ? {
        id: requestData.payments.id,
        status: requestData.payments.status,
        amount: requestData.payments.amount_paid, // Map amount_paid to amount
        date: formatDateTime(requestData.payments.paid_at, 'en-GB', 'Europe/London'), // Format with UK locale and timezone
        reference: requestData.payments.payment_ref,
        stripePaymentId: requestData.payments.stripe_payment_id,
        refundedAmount: requestData.payments.refund_amount,
        refundedAt: requestData.payments.refunded_at ? formatDateTime(requestData.payments.refunded_at, 'en-GB', 'Europe/London') : null, // Format with UK locale and timezone
        patientName: requestData.patient_name,
        patientEmail: requestData.patient_email,
        patientPhone: requestData.patient_phone,
        linkTitle: installment.paymentNumber 
          ? `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
          : 'Payment'
      } : null;
      
      console.log('Formatted payment info:', paymentInfo);
      setPaymentData(paymentInfo);
      return paymentInfo;
      
    } catch (error) {
      console.error('Error in fetchPaymentDetails:', error);
      toast.error('Failed to load payment details');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    paymentData,
    setPaymentData,
    fetchPaymentDetails
  };
};
