
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';

export const usePlanRescheduleActions = (
  selectedPlan: Plan | null,
  handleReschedulePlan: (planId: string, newStartDate: Date) => Promise<any>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  const handleOpenRescheduleDialog = () => {
    setShowRescheduleDialog(true);
  };

  const handleConfirmReschedulePlan = async (newStartDate: Date) => {
    if (!selectedPlan) return;
    
    const result = await handleReschedulePlan(selectedPlan.id, newStartDate);
    
    if (result.success) {
      setShowRescheduleDialog(false);
      setShowPlanDetails(false); // Close the plan details modal
    }
  };

  return {
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleReschedulePlan: handleConfirmReschedulePlan,
    handleOpenRescheduleDialog
  };
};
