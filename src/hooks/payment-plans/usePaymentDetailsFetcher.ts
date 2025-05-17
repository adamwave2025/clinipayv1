
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
      
      // Updated to access payment object correctly
      const paymentData = installment.payment || {};
      console.log('Payment Data:', paymentData);
      console.log('Payment ID from payment object:', paymentData?.id || 'Not set');
      console.log('Payment Request ID:', installment.paymentRequestId || 'Not set');
      console.log('Manual payment flag:', installment.manualPayment || false);
      
      // Determine if this is a payment plan payment
      // If we have totalPayments and paymentNumber, it's likely a plan payment
      const isPlanPayment = installment.totalPayments > 1;
      console.log('Is this a plan payment?', isPlanPayment);
      
      // For unpaid installments, create a placeholder payment object
      if (installment.status !== 'paid') {
        console.log('Creating placeholder payment data for unpaid installment');
        
        // Create a basic payment object with installment data
        const placeholderPayment: Payment = {
          id: installment.id,
          status: installment.status,
          amount: installment.amount,
          clinicId: installment.planId.split('-')[0] || '',
          date: installment.dueDate,
          patientName: 'Patient', // Will be updated with plan data
          netAmount: installment.amount,
          paymentMethod: installment.manualPayment ? 'manual' : 'card',
          type: 'payment_plan',
          linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
        };
        
        console.log('Created placeholder payment:', placeholderPayment);
        setPaymentData(placeholderPayment);
        setIsLoading(false);
        return placeholderPayment;
      }
      
      // Check if we have a direct payment ID from the payment object
      const paymentId = paymentData?.id || null;
      if (paymentId) {
        console.log('Fetching payment details directly for payment ID:', paymentId);
        
        // Fetch payment details directly using payment ID
        const { data: directPaymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();
          
        if (paymentError) {
          console.error('Error fetching payment:', paymentError);
          toast.error('Failed to load payment details');
          setIsLoading(false);
          return null;
        }
        
        console.log('Direct payment data:', directPaymentData);
        
        // Format the payment data to match the expected structure
        const paymentInfo: Payment = {
          id: directPaymentData.id,
          status: directPaymentData.status || 'paid',
          amount: directPaymentData.amount_paid,
          date: formatDateTime(directPaymentData.paid_at, 'en-GB', 'Europe/London'),
          reference: directPaymentData.payment_ref,
          stripePaymentId: directPaymentData.stripe_payment_id,
          refundedAmount: directPaymentData.refund_amount || 0,
          refundAmount: directPaymentData.refund_amount || 0,
          netAmount: directPaymentData.net_amount || directPaymentData.amount_paid,
          clinicId: directPaymentData.clinic_id || '',
          patientName: directPaymentData.patient_name || '',
          patientEmail: directPaymentData.patient_email || '',
          patientPhone: directPaymentData.patient_phone || '',
          manualPayment: directPaymentData.manual_payment || false,
          paymentMethod: directPaymentData.manual_payment ? 'manual' : 'card',
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
      if (!installment.paymentRequestId && !paymentData?.id) {
        console.log('No payment request ID or payment ID found for this installment');
        
        // Try a fallback approach: search for any payment that might be linked to this installment
        const { data: fallbackPayments, error: fallbackError } = await supabase
          .from('payments')
          .select('*')
          .eq('payment_link_id', installment.id) // Try using installment ID as a potential link
          .order('paid_at', { ascending: false })
          .limit(1);
          
        if (!fallbackError && fallbackPayments && fallbackPayments.length > 0) {
          // Found a payment through fallback approach
          const paymentData = fallbackPayments[0];
          console.log('Found payment through fallback approach:', paymentData);
          
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
            patientName: paymentData.patient_name || '',
            patientEmail: paymentData.patient_email || '',
            patientPhone: paymentData.patient_phone || '',
            paymentMethod: paymentData.manual_payment ? 'manual' : 'card',
            manualPayment: paymentData.manual_payment || false,
            type: isPlanPayment ? 'payment_plan' : 'other',
            linkTitle: installment.paymentNumber 
              ? `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
              : 'Payment'
          };
          
          setPaymentData(paymentInfo);
          setIsLoading(false);
          return paymentInfo;
        }
        
        // Create a placeholder payment for unpaid/unlinked installment
        const placeholderPayment: Payment = {
          id: installment.id,
          status: installment.status,
          amount: installment.amount,
          clinicId: installment.planId.split('-')[0] || '',
          date: installment.dueDate,
          patientName: 'Patient',
          netAmount: installment.amount,
          paymentMethod: 'none',
          type: 'payment_plan',
          linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
        };
        
        setPaymentData(placeholderPayment);
        setIsLoading(false);
        toast.info('Limited payment information available');
        return placeholderPayment;
      }
      
      console.log('Fetching payment details for request ID:', installment.paymentRequestId);
      
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
        // Explicitly set the type to payment_plan if this is a plan payment
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
        paymentMethod: 'none',
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
