
import { useState } from 'react';
import { Plan } from '@/utils/paymentPlanUtils';

export const usePlanResumeActions = (
  selectedPlan: Plan | null,
  handleResumePlanOperation: (patientId: string, paymentLinkId: string, resumeDate: Date) => Promise<boolean>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const handleOpenResumeDialog = () => {
    setShowResumeDialog(true);
  };

  const handleResumePlanConfirm = async (resumeDate: Date) => {
    if (!selectedPlan) return;
    
    // Log the date to help with debugging
    console.log('Resume plan with date:', resumeDate.toISOString());
    
    const [patientId, paymentLinkId] = selectedPlan.id.split('_');
    const success = await handleResumePlanOperation(patientId, paymentLinkId, resumeDate);
    
    if (success) {
      setShowResumeDialog(false);
      setShowPlanDetails(false);
    }
  };

  return {
    showResumeDialog,
    setShowResumeDialog,
    handleOpenResumeDialog,
    handleResumePlan: handleResumePlanConfirm
  };
};
