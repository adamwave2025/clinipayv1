
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
      console.log('Installation in fetchPaymentDetails:', installment);
      console.log('Payment ID:', installment.paymentId);
      console.log('Payment Request ID:', installment.paymentRequestId);
      
      // Determine if this is a payment plan payment
      // If we have totalPayments and paymentNumber, it's likely a plan payment
      const isPlanPayment = installment.totalPayments > 1;
      console.log('Is this a plan payment?', isPlanPayment);
      
      // Check if we have a direct payment ID (could happen with manual payments)
      if (installment.paymentId) {
        console.log('Fetching payment details directly for payment ID:', installment.paymentId);
        
        // Fetch payment details directly using payment ID
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('id', installment.paymentId)
          .single();
          
        if (paymentError) {
          console.error('Error fetching payment:', paymentError);
          toast.error('Failed to load payment details');
          setIsLoading(false);
          return null;
        }
        
        console.log('Direct payment data:', paymentData);
        
        // Format the payment data to match the expected structure
        const paymentInfo = {
          id: paymentData.id,
          status: paymentData.status,
          amount: paymentData.amount_paid,
          date: formatDateTime(paymentData.paid_at, 'en-GB', 'Europe/London'),
          reference: paymentData.payment_ref,
          stripePaymentId: paymentData.stripe_payment_id,
          refundedAmount: paymentData.refund_amount,
          refundedAt: paymentData.refunded_at ? formatDateTime(paymentData.refunded_at, 'en-GB', 'Europe/London') : null,
          patientName: paymentData.patient_name,
          patientEmail: paymentData.patient_email,
          patientPhone: paymentData.patient_phone,
          manualPayment: paymentData.manual_payment || false,
          // Explicitly set the type to payment_plan if this is a plan payment
          type: isPlanPayment ? 'payment_plan' : 'other',
          linkTitle: installment.paymentNumber 
            ? `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
            : 'Payment'
        };
        
        console.log('Formatted direct payment info:', paymentInfo);
        setPaymentData(paymentInfo);
        setIsLoading(false);
        return paymentInfo;
      }
      
      // If there is no payment request ID or payment ID, we can't fetch payment details
      if (!installment.paymentRequestId && !installment.paymentId) {
        console.log('No payment request ID or payment ID found for this installment');
        toast.error('No payment information available');
        setIsLoading(false);
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
            stripe_payment_id, refund_amount, refunded_at, manual_payment
          )
        `)
        .eq('id', installment.paymentRequestId)
        .single();
      
      if (requestError) {
        console.error('Error fetching payment request:', requestError);
        toast.error('Failed to load payment details');
        setIsLoading(false);
        return null;
      }
      
      console.log('Payment request data:', requestData);
      
      // Extract payment information from the request
      const paymentInfo = requestData.payments ? {
        id: requestData.payments.id,
        status: requestData.payments.status,
        amount: requestData.payments.amount_paid,
        date: formatDateTime(requestData.payments.paid_at, 'en-GB', 'Europe/London'),
        reference: requestData.payments.payment_ref,
        stripePaymentId: requestData.payments.stripe_payment_id,
        refundedAmount: requestData.payments.refund_amount,
        refundedAt: requestData.payments.refunded_at ? formatDateTime(requestData.payments.refunded_at, 'en-GB', 'Europe/London') : null,
        patientName: requestData.patient_name,
        patientEmail: requestData.patient_email,
        patientPhone: requestData.patient_phone,
        manualPayment: requestData.payments.manual_payment || false,
        // Explicitly set the type to payment_plan if this is a plan payment
        type: isPlanPayment ? 'payment_plan' : 'other',
        linkTitle: installment.paymentNumber 
          ? `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
          : 'Payment'
      } : null;
      
      console.log('Formatted payment info:', paymentInfo);
      setPaymentData(paymentInfo);
      setIsLoading(false);
      return paymentInfo;
      
    } catch (error) {
      console.error('Error in fetchPaymentDetails:', error);
      toast.error('Failed to load payment details');
      setIsLoading(false);
      return null;
    }
  };
  
  return {
    isLoading,
    paymentData,
    setPaymentData,
    fetchPaymentDetails
  };
};
