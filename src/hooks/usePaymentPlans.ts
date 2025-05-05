
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
      
      // Use clinic_id directly from user for better consistency
      const clinicId = user.id;
      console.log(`Fetching payment plans for clinic ID: ${clinicId}, archived: ${isArchiveView}`);
      
      const { plans, error } = await PaymentPlanService.fetchPaymentPlans(clinicId, isArchiveView);
      
      if (error) {
        toast.error('Failed to load payment plans');
        console.error('Error fetching payment plans:', error);
      } else {
        console.log(`${isArchiveView ? 'Archived' : 'Active'} payment plans fetched:`, plans);
        setPaymentPlans(plans);
      }
    } catch (e) {
      console.error('Exception in fetchPaymentPlans:', e);
      toast.error('An error occurred while loading payment plans');
    } finally {
      setIsLoading(false);
    }
  };

  // Get search functionality
  const { searchQuery, setSearchQuery, filteredPlans } = usePaymentPlanSearch(paymentPlans);
  
  // Handle archiving a plan
  const handleArchivePlan = async (plan: PaymentLink) => {
    try {
      const { success } = await PaymentPlanService.archivePlan(plan);
      
      if (success) {
        toast.success(`Plan "${plan.title}" archived successfully`);
        // Refresh the plans list
        await fetchPaymentPlans();
      }
    } catch (e) {
      console.error('Error archiving plan:', e);
      toast.error('Failed to archive plan');
    }
  };

  // Handle unarchiving a plan
  const handleUnarchivePlan = async (plan: PaymentLink) => {
    try {
      const { success } = await PaymentPlanService.unarchivePlan(plan);
      
      if (success) {
        toast.success(`Plan "${plan.title}" restored successfully`);
        // Refresh the plans list
        await fetchPaymentPlans();
      }
    } catch (e) {
      console.error('Error unarchiving plan:', e);
      toast.error('Failed to restore plan');
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
