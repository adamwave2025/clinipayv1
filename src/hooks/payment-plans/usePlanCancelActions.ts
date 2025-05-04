
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';

export const usePlanCancelActions = (
  selectedPlan: Plan | null,
  handleCancelPlan: (planId: string) => Promise<any>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancelPlan = async () => {
    if (!selectedPlan) return;
    
    const result = await handleCancelPlan(selectedPlan.id);
    
    if (result.success) {
      setShowCancelDialog(false);
      setShowPlanDetails(false); // Close the plan details modal
    }
  };

  return {
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan: handleConfirmCancelPlan,
    handleOpenCancelDialog
  };
};
