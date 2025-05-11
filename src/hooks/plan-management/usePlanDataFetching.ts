
import { Plan } from '@/utils/planTypes';
import { PlanDataService } from '@/services/PlanDataService';

/**
 * Hook to handle fetching plan details
 */
export const usePlanDataFetching = (
  setSelectedPlan: (plan: Plan | null) => void,
  setPlanInstallments: (installments: any[]) => void,
  setPlanActivities: (activities: any[]) => void,
  setIsLoadingInstallments: (loading: boolean) => void,
  setIsLoadingActivities: (loading: boolean) => void,
  setShowPlanDetails: (show: boolean) => void,
  selectedPlan: Plan | null
) => {
  /**
   * View plan details and fetch related data
   */
  const handleViewPlanDetails = async (plan: Plan) => {
    setSelectedPlan(plan);
    await fetchPlanDetails(plan);
    setShowPlanDetails(true);
  };
  
  /**
   * Fetch both installments and activities for a plan
   */
  const fetchPlanDetails = async (plan: Plan) => {
    setIsLoadingInstallments(true);
    setIsLoadingActivities(true);
    
    try {
      const { installments, activities } = await PlanDataService.fetchPlanDetails(plan);
      setPlanInstallments(installments);
      setPlanActivities(activities);
    } catch (err) {
      console.error('Error fetching plan details:', err);
    } finally {
      setIsLoadingInstallments(false);
      setIsLoadingActivities(false);
    }
  };

  /**
   * Refresh plan details after modifications
   */
  const refreshPlanDetails = async () => {
    if (selectedPlan) {
      await fetchPlanDetails(selectedPlan);
    }
  };

  return {
    handleViewPlanDetails,
    fetchPlanDetails,
    refreshPlanDetails
  };
};
