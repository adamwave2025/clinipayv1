
/**
 * Hook to manage dialog controls for the plan management UI
 */
export const useDialogControls = (
  setShowPlanDetails: (show: boolean) => void,
  setShowCancelDialog: (show: boolean) => void,
  setShowPauseDialog: (show: boolean) => void,
  setShowResumeDialog: (show: boolean) => void,
  setShowRescheduleDialog: (show: boolean) => void,
  checkSentPayments: () => Promise<void>
) => {
  // Dialog opening handlers
  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
    setShowPlanDetails(false);
  };
  
  const handleOpenPauseDialog = () => {
    setShowPauseDialog(true);
    setShowPlanDetails(false);
  };
  
  const handleOpenResumeDialog = async () => {
    // Check if there are sent payments first
    await checkSentPayments();
    setShowResumeDialog(true);
    setShowPlanDetails(false);
  };
  
  const handleOpenRescheduleDialog = () => {
    setShowRescheduleDialog(true);
    setShowPlanDetails(false);
  };

  return {
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
    handleOpenRescheduleDialog
  };
};
