
import { useState, useMemo } from 'react';
import { PaymentLink } from '@/types/payment';

export const usePaymentPlanSearch = (paymentPlans: PaymentLink[]) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlans = useMemo(() => {
    console.log(`Filtering ${paymentPlans.length} plans with query: '${searchQuery}'`);
    
    if (!searchQuery.trim()) {
      return paymentPlans;
    }

    const query = searchQuery.toLowerCase().trim();
    return paymentPlans.filter(plan => 
      (plan.title && plan.title.toLowerCase().includes(query)) ||
      (plan.description && plan.description.toLowerCase().includes(query)) ||
      (plan.paymentCycle && plan.paymentCycle.toLowerCase().includes(query))
    );
  }, [paymentPlans, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredPlans
  };
};
