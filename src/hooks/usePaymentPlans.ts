
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentPlanService } from '@/services/PaymentPlanService';
import { usePaymentPlanSearch } from '@/hooks/usePaymentPlanSearch';

export const usePaymentPlans = () => {
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiveView, setIsArchiveView] = useState(false);
  
  const { user } = useAuth();

  // Fetch payment plans when user is available or archive view changes
  useEffect(() => {
    if (user) {
      fetchPaymentPlans();
    }
  }, [user, isArchiveView]);

  const fetchPaymentPlans = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        console.error('No user found when trying to fetch payment plans');
        setIsLoading(false);
        return;
      }
      
      const { plans, error } = await PaymentPlanService.fetchPaymentPlans(user.id, isArchiveView);
      
      if (error) {
        toast.error('Failed to load payment plans');
      } else {
        console.log(`${isArchiveView ? 'Archived' : 'Active'} payment plans fetched:`, plans);
        setPaymentPlans(plans);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get search functionality
  const { searchQuery, setSearchQuery, filteredPlans } = usePaymentPlanSearch(paymentPlans);
  
  // Handle archiving a plan
  const handleArchivePlan = async (plan: PaymentLink) => {
    const { success } = await PaymentPlanService.archivePlan(plan);
    
    if (success) {
      // Refresh the plans list
      await fetchPaymentPlans();
    }
  };

  // Handle unarchiving a plan
  const handleUnarchivePlan = async (plan: PaymentLink) => {
    const { success } = await PaymentPlanService.unarchivePlan(plan);
    
    if (success) {
      // Refresh the plans list
      await fetchPaymentPlans();
    }
  };

  // Toggle between active and archived views
  const toggleArchiveView = () => {
    setIsArchiveView(prev => !prev);
  };

  return {
    paymentPlans,
    filteredPlans,
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchPaymentPlans,
    isArchiveView,
    setIsArchiveView,
    toggleArchiveView,
    handleArchivePlan,
    handleUnarchivePlan
  };
};
