
import { useState } from 'react';
import { Payment, PaymentLink } from '@/types/payment';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { clinicId } = useUnifiedAuth();

  const fetchPayments = async (paymentLinks?: PaymentLink[]) => {
    if (!clinicId) {
      console.warn('No clinic ID available for payments');
      setError('No clinic ID available');
      return [];
    }

    setIsLoadingPayments(true);
    setError(null);
    
    try {
      // Fetch payments for the clinic
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('paid_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching payments:', error);
        setError(error.message);
        return [];
      }
      
      const formattedPayments = data.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount_paid || 0,
        date: payment.paid_at,
        clinicId: payment.clinic_id,
        patientName: payment.patient_name || 'Unknown Patient',
        patientEmail: payment.patient_email,
        patientPhone: payment.patient_phone,
        status: payment.status,
        refundAmount: payment.refund_amount,
        refundedAmount: payment.refund_amount, // Alias for backward compatibility
        netAmount: payment.net_amount || payment.amount_paid || 0,
        paymentMethod: 'card', // Default for now
        paymentReference: payment.payment_ref,
        reference: payment.payment_ref, // Alias for backward compatibility
        stripePaymentId: payment.stripe_payment_id,
        manualPayment: payment.manual_payment || false
      }));
      
      setPayments(formattedPayments);
      setIsLoadingPayments(false);
      return formattedPayments;
    } catch (e) {
      console.error('Exception in fetchPayments:', e);
      setError('Failed to fetch payments');
      setIsLoadingPayments(false);
      return [];
    }
  };
  
  return { 
    payments, 
    setPayments, 
    isLoadingPayments, 
    fetchPayments,
    error 
  };
};
