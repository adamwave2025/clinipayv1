
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentPlanService } from '@/services/PaymentPlanService';
import { usePaymentPlanActions } from '@/hooks/usePaymentPlanActions';
import { usePaymentPlanSearch } from '@/hooks/usePaymentPlanSearch';

export const usePaymentPlans = () => {
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();

  // Fetch payment plans when user is available
  useEffect(() => {
    if (user) {
      fetchPaymentPlans();
    }
  }, [user]);

  const fetchPaymentPlans = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        console.error('No user found when trying to fetch payment plans');
        setIsLoading(false);
        return;
      }
      
      const { plans, error } = await PaymentPlanService.fetchPaymentPlans(user.id);
      
      if (error) {
        toast.error('Failed to load payment plans');
      } else {
        setPaymentPlans(plans);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get search functionality
  const { searchQuery, setSearchQuery, filteredPlans } = usePaymentPlanSearch(paymentPlans);
  
  // Get actions functionality
  const actions = usePaymentPlanActions(fetchPaymentPlans);

  // Return everything combined
  return {
    paymentPlans,
    filteredPlans,
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchPaymentPlans,
    ...actions
  };
};
