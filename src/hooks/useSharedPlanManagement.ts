
import { Plan } from '@/utils/planTypes';
import { isPlanPaused } from '@/utils/plan-status-utils';
import { usePlanDetailsState } from './plan-management/usePlanDetailsState';
import { usePlanOperations } from './plan-management/usePlanOperations';
import { usePlanDataFetching } from './plan-management/usePlanDataFetching';
import { useDialogControls } from './plan-management/useDialogControls';

/**
 * Shared hook to manage payment plan operations across different parts of the application.
 * This consolidates plan management logic so it can be reused in both the main plans area
 * and the patient details area.
 */
export const useSharedPlanManagement = () => {
  // Use our state management hook to get all state variables and setters
  const planState = usePlanDetailsState();
  
  const {
    selectedPlan,
    setSelectedPlan,
    planInstallments,
    setPlanInstallments,
    planActivities,
    setPlanActivities,
    isLoadingInstallments,
    setIsLoadingInstallments,
    isLoadingActivities,
    setIsLoadingActivities,
    showPlanDetails,
    setShowPlanDetails,
    isProcessing,
    setIsProcessing,
    showCancelDialog,
    setShowCancelDialog,
    showPauseDialog,
    setShowPauseDialog,
    showResumeDialog,
    setShowResumeDialog,
    showRescheduleDialog,
    setShowRescheduleDialog,
    hasSentPayments,
    setHasSentPayments
  } = planState;

  // Use our data fetching hook
  const dataFetching = usePlanDataFetching(
    setSelectedPlan,
    setPlanInstallments,
    setPlanActivities,
    setIsLoadingInstallments,
    setIsLoadingActivities,
    setShowPlanDetails,
    selectedPlan
  );

  const {
    handleViewPlanDetails,
    fetchPlanDetails,
    refreshPlanDetails
  } = dataFetching;

  // Use our plan operations hook
  const planOperations = usePlanOperations(
    selectedPlan,
    setSelectedPlan,
    setIsProcessing,
    setHasSentPayments,
    setShowPlanDetails,
    refreshPlanDetails
  );

  // Use our dialog controls hook
  const dialogControls = useDialogControls(
    setShowPlanDetails,
    setShowCancelDialog,
    setShowPauseDialog,
    setShowResumeDialog,
    setShowRescheduleDialog,
    planOperations.handleOpenResumeDialog
  );

  return {
    // Plan and related data
    selectedPlan,
    planInstallments,
    planActivities,
    isLoadingInstallments,
    isLoadingActivities,
    
    // UI state
    showPlanDetails,
    setShowPlanDetails,
    
    // Dialog states
    showCancelDialog,
    setShowCancelDialog,
    showPauseDialog,
    setShowPauseDialog,
    showResumeDialog,
    setShowResumeDialog,
    showRescheduleDialog,
    setShowRescheduleDialog,
    
    // Plan view handlers
    handleViewPlanDetails,
    refreshPlanDetails,
    
    // Dialog opening handlers
    handleOpenCancelDialog: dialogControls.handleOpenCancelDialog,
    handleOpenPauseDialog: dialogControls.handleOpenPauseDialog,
    handleOpenResumeDialog: dialogControls.handleOpenResumeDialog,
    handleOpenRescheduleDialog: dialogControls.handleOpenRescheduleDialog,
    
    // Plan operation handlers
    handleCancelPlan: planOperations.handleCancelPlan,
    handlePausePlan: planOperations.handlePausePlan,
    handleResumePlan: planOperations.handleResumePlan,
    handleReschedulePlan: planOperations.handleReschedulePlan,
    
    // Status helpers
    isPlanPaused,
    isProcessing,
    
    // State to track sent payments during resume operations
    hasSentPayments
  };
};
