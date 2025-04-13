
import { useState } from 'react';
import { Payment } from '@/types/payment';

export function usePaymentState() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  
  return {
    payments,
    setPayments,
    isLoadingPayments,
    setIsLoadingPayments
  };
}
