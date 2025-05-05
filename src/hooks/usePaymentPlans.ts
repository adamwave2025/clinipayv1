
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
  const [isTemplateView, setIsTemplateView] = useState(true); // Default to template view since we're on the templates page
  
  const { user } = useAuth();

  // Fetch payment plans when user is available or archive/template view changes
  useEffect(() => {
    if (user) {
      fetchPaymentPlans();
    }
  }, [user, isArchiveView, isTemplateView]);

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
      console.log(`Fetching payment plans for clinic ID: ${clinicId}, archived: ${isArchiveView}, templates: ${isTemplateView}`);
      
      const { plans, error } = await PaymentPlanService.fetchPaymentPlans(clinicId, isArchiveView, isTemplateView);
      
      if (error) {
        toast.error('Failed to load payment plans');
        console.error('Error fetching payment plans:', error);
      } else {
        console.log(`Fetched ${plans.length} ${isTemplateView ? 'plan templates' : 'patient plans'}`);
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
  
  // Toggle between template and active patient plan views
  const toggleTemplateView = () => {
    setIsTemplateView(prev => !prev);
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
    isTemplateView,
    setIsTemplateView,
    toggleTemplateView,
    handleArchivePlan,
    handleUnarchivePlan
  };
};
