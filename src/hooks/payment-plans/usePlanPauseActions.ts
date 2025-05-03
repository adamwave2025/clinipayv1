
import { useState } from 'react';
import { Plan } from '@/utils/paymentPlanUtils';

export const usePlanPauseActions = (
  selectedPlan: Plan | null,
  handlePausePlanOperation: (patientId: string, paymentLinkId: string) => Promise<boolean>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  const handleOpenPauseDialog = () => {
    setShowPauseDialog(true);
  };

  const handlePausePlanConfirm = async () => {
    if (!selectedPlan) return;
    
    const [patientId, paymentLinkId] = selectedPlan.id.split('_');
    const success = await handlePausePlanOperation(patientId, paymentLinkId);
    
    if (success) {
      setShowPauseDialog(false);
      setShowPlanDetails(false);
    }
  };

  return {
    showPauseDialog,
    setShowPauseDialog,
    handleOpenPauseDialog,
    handlePausePlan: handlePausePlanConfirm
  };
};
