
import { useState, useEffect } from 'react';
import { Payment, PaymentLink } from '@/types/payment';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/formatters';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchPayments();
  }, [user]);
  
  const fetchPayments = async (paymentLinks: PaymentLink[] = []) => {
    if (!user) return;

    setIsLoadingPayments(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData.clinic_id) return;

      // Fetch completed payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('clinic_id', userData.clinic_id)
        .order('paid_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch sent payment requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('clinic_id', userData.clinic_id)
        .is('paid_at', null) // Only get unpaid/sent requests
        .order('sent_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Format completed payments
      const formattedPayments: Payment[] = paymentsData.map(payment => {
        // Format the date correctly using our utility function
        const paidDate = payment.paid_at ? new Date(payment.paid_at) : new Date();
        
        return {
          id: payment.id,
          patientName: payment.patient_name || 'Unknown Patient',
          patientEmail: payment.patient_email,
          patientPhone: payment.patient_phone || undefined,
          amount: payment.amount_paid || 0,
          date: formatDate(paidDate),
          status: payment.status as any || 'paid',
          type: 'consultation', // Default type
          reference: payment.payment_ref || undefined, // Add payment reference
          // Include refundedAmount for both partially_refunded and refunded statuses
          ...(payment.status === 'partially_refunded' && { refundedAmount: payment.refund_amount || 0 }),
          ...(payment.status === 'refunded' && { refundedAmount: payment.refund_amount || 0 })
        };
      });

      // Format payment requests as "sent" payments
      const formattedRequests: Payment[] = requestsData.map(request => {
        // Determine amount - either from custom amount or linked payment link
        let amount = 0;
        if (request.custom_amount) {
          amount = request.custom_amount;
        } else if (request.payment_link_id) {
          // Find the matching payment link to get its amount
          const paymentLink = paymentLinks.find(link => link.id === request.payment_link_id);
          if (paymentLink) {
            amount = paymentLink.amount;
          }
        }
        
        // Ensure we have a valid date for sent_at
        const sentDate = request.sent_at ? new Date(request.sent_at) : new Date();

        return {
          id: request.id,
          patientName: request.patient_name || 'Unknown Patient',
          patientEmail: request.patient_email,
          patientPhone: request.patient_phone || undefined,
          amount: amount,
          date: formatDate(sentDate),
          status: 'sent',
          type: 'consultation', // Default type
        };
      });

      // Combine both lists
      const allPayments = [...formattedPayments, ...formattedRequests];
      // Sort by date (newest first) - using actual Date objects for comparison
      allPayments.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching payments data:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  return {
    payments,
    setPayments,
    isLoadingPayments,
    fetchPayments
  };
}
