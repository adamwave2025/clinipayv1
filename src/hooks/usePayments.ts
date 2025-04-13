
import { useEffect } from 'react';
import { Payment, PaymentLink } from '@/types/payment';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentState } from './payments/usePaymentState';
import { usePaymentFetcher } from './payments/usePaymentFetcher';
import { usePaymentFormatter } from './payments/usePaymentFormatter';

export function usePayments() {
  const { user } = useAuth();
  const { payments, setPayments, isLoadingPayments, setIsLoadingPayments } = usePaymentState();
  const { fetchPayments } = usePaymentFetcher(setIsLoadingPayments);
  const { formatCompletedPayments, formatPaymentRequests, combineAndSortPayments } = usePaymentFormatter();
  
  const processPayments = async (paymentLinks: PaymentLink[] = []) => {
    if (!user) return;
    
    const result = await fetchPayments();
    
    if (result.paymentsData.length === 0 && result.requestsData.length === 0) {
      setPayments([]);
      return;
    }
    
    // Format the raw data into our Payment type
    const formattedPayments = formatCompletedPayments(result.paymentsData);
    const formattedRequests = formatPaymentRequests(result.requestsData, paymentLinks);
    
    // Combine and sort the results
    const sortedPayments = combineAndSortPayments(formattedPayments, formattedRequests);
    
    setPayments(sortedPayments);
  };

  useEffect(() => {
    processPayments();
  }, [user]);

  return {
    payments,
    setPayments,
    isLoadingPayments,
    fetchPayments: processPayments
  };
}
