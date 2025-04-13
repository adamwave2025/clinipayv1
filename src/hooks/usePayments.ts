
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

      // Fetch completed payments with payment_link_id
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          payment_links(id, type, title)
        `)
        .eq('clinic_id', userData.clinic_id)
        .order('paid_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch sent payment requests with payment_link_id
      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select(`
          *,
          payment_links(id, type, title)
        `)
        .eq('clinic_id', userData.clinic_id)
        .is('paid_at', null) // Only get unpaid/sent requests
        .order('sent_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Format completed payments
      const formattedPayments: Payment[] = paymentsData.map(payment => {
        // Format the date correctly using our utility function
        const paidDate = payment.paid_at ? new Date(payment.paid_at) : new Date();
        
        // Determine the payment type
        let paymentType: Payment['type'] = 'consultation'; // Default type
        let linkTitle: string | undefined = undefined;
        
        // If linked to a payment link, use that type and title
        if (payment.payment_links) {
          if (payment.payment_links.type) {
            const linkType = payment.payment_links.type;
            // Ensure type is one of the allowed values
            if (['deposit', 'treatment', 'consultation', 'other'].includes(linkType)) {
              paymentType = linkType as Payment['type'];
            }
          }
          
          if (payment.payment_links.title) {
            linkTitle = payment.payment_links.title;
          }
        }
        
        return {
          id: payment.id,
          patientName: payment.patient_name || 'Unknown Patient',
          patientEmail: payment.patient_email,
          patientPhone: payment.patient_phone || undefined,
          amount: payment.amount_paid || 0,
          date: formatDate(paidDate),
          status: payment.status as any || 'paid',
          type: paymentType,
          linkTitle: linkTitle,
          reference: payment.payment_ref || undefined,
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
        
        // Determine payment type and get link title
        let paymentType: Payment['type'] = 'other'; // Default fallback
        let linkTitle: string | undefined = undefined;
        
        if (request.custom_amount && !request.payment_link_id) {
          // It's a custom payment request
          paymentType = 'other';
          linkTitle = 'Custom Payment Request';
        } else if (request.payment_links) {
          // It's a payment link-based request, use the link's type and title
          if (request.payment_links.type) {
            const linkType = request.payment_links.type;
            if (['deposit', 'treatment', 'consultation', 'other'].includes(linkType)) {
              paymentType = linkType as Payment['type'];
            }
          }
          
          if (request.payment_links.title) {
            linkTitle = request.payment_links.title;
          }
        }
        
        // Ensure we have a valid date for sent_at
        const sentDate = request.sent_at ? new Date(request.sent_at) : new Date();
        
        // Construct payment URL for sent requests
        const paymentUrl = request.id 
          ? `${window.location.origin}/payment/request/${request.id}`
          : undefined;

        return {
          id: request.id,
          patientName: request.patient_name || 'Unknown Patient',
          patientEmail: request.patient_email,
          patientPhone: request.patient_phone || undefined,
          amount: amount,
          date: formatDate(sentDate),
          status: 'sent',
          type: paymentType,
          linkTitle: linkTitle,
          message: request.message,
          paymentUrl: paymentUrl
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
