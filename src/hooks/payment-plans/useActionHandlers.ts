
import { Plan } from '@/utils/planTypes';
import { usePlanActions } from './usePlanActions';
import { usePlanDetailsView } from './usePlanDetailsView';

/**
 * Hook for handling various plan actions
 */
export const useActionHandlers = (fetchPaymentPlans: (userId: string) => Promise<Plan[]>, fetchPlanInstallmentsData: (planId: string) => Promise<any[]>) => {
  // Use plan details view hook
  const { 
    selectedPlan, 
    setSelectedPlan,
    showPlanDetails, 
    setShowPlanDetails,
    isPlanPaused,
    handleViewPlanDetails: viewPlanDetails,
    handleBackToPlans
  } = usePlanDetailsView();
  
  // Create a wrapper for fetchPaymentPlans to match the expected signature
  const wrappedFetchPlans = async (userId?: string) => {
    if (!userId) {
      console.error('No userId provided to wrappedFetchPlans');
      return [];
    }
    return fetchPaymentPlans(userId);
  };
  
  // Pass the wrapped function to usePlanActions
  const { 
    isProcessing,
    handleSendReminder: sendReminder
  } = usePlanActions(wrappedFetchPlans);

  const handleViewPlanDetails = async (plan: Plan) => {
    console.log('useActionHandlers.handleViewPlanDetails called with plan:', plan.id);
    return viewPlanDetails(plan, fetchPlanInstallmentsData);
  };

  // Create a wrapper for sendReminder that adapts the return type
  const handleSendReminder = async (installmentId: string): Promise<void> => {
    await sendReminder(installmentId);
    // Void return type, so no return statement needed
  };
  
  return {
    selectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    isProcessing,
    isPlanPaused,
    handleViewPlanDetails,
    handleSendReminder,
    handleBackToPlans
  };
};
