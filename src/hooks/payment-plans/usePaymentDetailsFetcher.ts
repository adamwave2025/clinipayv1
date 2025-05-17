
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { Payment } from '@/types/payment';

export const usePaymentDetailsFetcher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<Payment | null>(null);

  const fetchPaymentDetails = async (installment: PlanInstallment) => {
    setIsLoading(true);
    
    try {
      console.log('Installation in fetchPaymentDetails:', installment);
      console.log('Payment ID:', installment.paymentId || 'Not set');
      console.log('Payment Request ID:', installment.paymentRequestId || 'Not set');
      console.log('Manual payment flag:', installment.manualPayment || false);
      
      // Determine if this is a payment plan payment
      // If we have totalPayments and paymentNumber, it's likely a plan payment
      const isPlanPayment = installment.totalPayments > 1;
      console.log('Is this a plan payment?', isPlanPayment);
      
      // For paid installments with paymentId, fetch the payment details directly
      if (installment.status === 'paid' && installment.paymentId) {
        console.log('Fetching payment details for paid installment with payment ID:', installment.paymentId);
        
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
        
        console.log('Retrieved payment data:', paymentData);
        
        // Create payment object from DB data
        const paymentInfo: Payment = {
          id: paymentData.id,
          status: paymentData.status || 'paid',
          amount: paymentData.amount_paid,
          date: formatDateTime(paymentData.paid_at, 'en-GB', 'Europe/London'),
          reference: paymentData.payment_ref,
          stripePaymentId: paymentData.stripe_payment_id,
          refundedAmount: paymentData.refund_amount || 0,
          refundAmount: paymentData.refund_amount || 0,
          netAmount: paymentData.net_amount || paymentData.amount_paid,
          clinicId: paymentData.clinic_id || '',
          patientName: paymentData.patient_name || installment.patientName || '',
          patientEmail: paymentData.patient_email || '',
          patientPhone: paymentData.patient_phone || '',
          manualPayment: paymentData.manual_payment || false,
          paymentMethod: paymentData.manual_payment ? 'manual' : 'card',
          type: isPlanPayment ? 'payment_plan' : 'other',
          linkTitle: installment.paymentNumber 
            ? `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
            : 'Payment'
        };
        
        console.log('Formatted payment info:', paymentInfo);
        setPaymentData(paymentInfo);
        setIsLoading(false);
        return paymentInfo;
      }
      
      // For unpaid installments or those without a paymentId, create a placeholder
      if (installment.status !== 'paid' || !installment.paymentId) {
        console.log('Creating placeholder payment data for unpaid/unlinked installment');
        
        // Create a basic payment object with installment data
        const placeholderPayment: Payment = {
          id: installment.id,
          status: installment.status,
          amount: installment.amount,
          clinicId: installment.planId ? installment.planId.split('-')[0] || '' : '',
          date: installment.dueDate,
          patientName: installment.patientName || 'Patient',
          netAmount: installment.amount,
          paymentMethod: installment.manualPayment ? 'manual' : 'card',
          manualPayment: installment.manualPayment || false,
          type: 'payment_plan',
          linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
        };
        
        console.log('Created placeholder payment:', placeholderPayment);
        setPaymentData(placeholderPayment);
        setIsLoading(false);
        return placeholderPayment;
      }
      
      // If we reach here, we need to use the fallback approach with payment request
      console.log('Using fallback approach for payment request ID:', installment.paymentRequestId);
      
      // First get the payment request details
      const { data: requestData, error: requestError } = await supabase
        .from('payment_requests')
        .select(`
          id, payment_id, patient_name, patient_email, patient_phone, clinic_id,
          payments (
            id, amount_paid, status, paid_at, payment_ref, 
            stripe_payment_id, refund_amount, refunded_at, manual_payment, net_amount
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
      
      // If we have a payment_id but no nested payment data, fetch the payment directly
      if (requestData.payment_id && (!requestData.payments || Object.keys(requestData.payments).length === 0)) {
        console.log('Payment request has payment_id but no nested data, fetching payment directly:', requestData.payment_id);
        
        const { data: directPaymentData, error: directPaymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('id', requestData.payment_id)
          .single();
          
        if (directPaymentError) {
          console.error('Error fetching direct payment:', directPaymentError);
          toast.error('Failed to load payment details');
          setIsLoading(false);
          return null;
        }
        
        console.log('Fetched direct payment data:', directPaymentData);
        
        // Use the direct payment data
        requestData.payments = directPaymentData;
      }
      
      // Extract payment information from the request
      const paymentInfo: Payment = requestData.payments ? {
        id: requestData.payments.id || requestData.payment_id,
        status: requestData.payments.status || 'paid',
        amount: requestData.payments.amount_paid,
        date: formatDateTime(requestData.payments.paid_at, 'en-GB', 'Europe/London'),
        reference: requestData.payments.payment_ref,
        stripePaymentId: requestData.payments.stripe_payment_id,
        refundedAmount: requestData.payments.refund_amount || 0,
        refundAmount: requestData.payments.refund_amount || 0,
        netAmount: requestData.payments.net_amount || requestData.payments.amount_paid,
        clinicId: requestData.clinic_id || '',
        patientName: requestData.patient_name || '',
        patientEmail: requestData.patient_email || '',
        patientPhone: requestData.patient_phone || '',
        paymentMethod: requestData.payments.manual_payment ? 'manual' : 'card',
        manualPayment: requestData.payments.manual_payment || false,
        type: isPlanPayment ? 'payment_plan' : 'other',
        linkTitle: installment.paymentNumber 
          ? `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
          : 'Payment'
      } : {
        // Placeholder payment if no payment data is found
        id: installment.id,
        status: installment.status,
        amount: installment.amount,
        date: installment.dueDate,
        clinicId: requestData.clinic_id || '',
        netAmount: installment.amount,
        patientName: requestData.patient_name || 'Patient',
        patientEmail: requestData.patient_email || '',
        patientPhone: requestData.patient_phone || '',
        paymentMethod: installment.manualPayment ? 'manual' : 'card',
        manualPayment: installment.manualPayment || false,
        type: 'payment_plan',
        linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
      };
      
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
