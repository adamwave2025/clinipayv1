
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';

export const usePlanPauseActions = (
  selectedPlan: Plan | null,
  handlePausePlan: (planId: string) => Promise<any>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  const handleOpenPauseDialog = () => {
    setShowPauseDialog(true);
  };

  const handleConfirmPausePlan = async () => {
    if (!selectedPlan) return;
    
    const result = await handlePausePlan(selectedPlan.id);
    
    if (result.success) {
      setShowPauseDialog(false);
      setShowPlanDetails(false); // Close the plan details modal
    }
  };

  return {
    showPauseDialog,
    setShowPauseDialog,
    handlePausePlan: handleConfirmPausePlan,
    handleOpenPauseDialog
  };
};
