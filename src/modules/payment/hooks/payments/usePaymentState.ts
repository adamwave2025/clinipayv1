
import { useState } from 'react';
import { Payment } from '../../types/payment';

export function usePaymentState() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    search: ''
  });

  const updatePayments = (newPayments: Payment[]) => {
    setPayments(newPayments);
    setIsLoading(false);
  };

  const updateFilters = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  return {
    payments,
    isLoading,
    error,
    filters,
    updatePayments,
    updateFilters,
    setIsLoading,
    setError
  };
}
