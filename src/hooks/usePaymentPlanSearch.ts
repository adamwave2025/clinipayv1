
import { useState, useEffect } from 'react';
import { PaymentLink } from '@/types/payment';

export const usePaymentPlanSearch = (paymentPlans: PaymentLink[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlans, setFilteredPlans] = useState<PaymentLink[]>([]);

  // Filter plans when search query changes
  useEffect(() => {
    if (paymentPlans.length === 0) {
      setFilteredPlans([]);
      return;
    }
    
    if (!searchQuery.trim()) {
      setFilteredPlans(paymentPlans);
      return;
    }
    
    const filtered = paymentPlans.filter(plan => 
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredPlans(filtered);
  }, [searchQuery, paymentPlans]);

  return {
    searchQuery,
    setSearchQuery,
    filteredPlans
  };
};
