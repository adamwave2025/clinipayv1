
import { useState, useMemo } from 'react';
import { PaymentLink } from '@/types/payment';

export const usePaymentPlanSearch = (paymentPlans: PaymentLink[]) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) {
      return paymentPlans;
    }

    const query = searchQuery.toLowerCase().trim();
    return paymentPlans.filter(plan => 
      plan.title?.toLowerCase().includes(query) || 
      plan.description?.toLowerCase().includes(query)
    );
  }, [paymentPlans, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredPlans
  };
};
