
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';

export const usePlanResumeActions = (
  selectedPlan: Plan | null,
  handleResumePlan: (planId: string, resumeDate: Date) => Promise<any>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const handleOpenResumeDialog = () => {
    setShowResumeDialog(true);
  };

  const handleConfirmResumePlan = async (resumeDate: Date) => {
    if (!selectedPlan) return;
    
    const result = await handleResumePlan(selectedPlan.id, resumeDate);
    
    if (result.success) {
      setShowResumeDialog(false);
      setShowPlanDetails(false); // Close the plan details modal
    }
  };

  return {
    showResumeDialog,
    setShowResumeDialog,
    handleResumePlan: handleConfirmResumePlan,
    handleOpenResumeDialog
  };
};
