
import { Plan } from '@/utils/planTypes';
import { usePlanActions } from './usePlanActions';
import { usePlanDetailsView } from './usePlanDetailsView';

/**
 * Hook for handling various plan actions
 */
export const useActionHandlers = (fetchPaymentPlans: (userId: string) => Promise<Plan[]>, fetchPlanInstallmentsData: (planId: string) => Promise<void>) => {
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
  
  // Pass fetchPaymentPlans directly as it returns Promise<Plan[]>
  const { 
    isProcessing,
    handleSendReminder: sendReminder
  } = usePlanActions(fetchPaymentPlans);

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
