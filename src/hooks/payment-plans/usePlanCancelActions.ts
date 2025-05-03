
import { useState } from 'react';
import { Plan } from '@/utils/paymentPlanUtils';

export const usePlanCancelActions = (
  selectedPlan: Plan | null,
  handleCancelPlanOperation: (patientId: string, paymentLinkId: string) => Promise<boolean>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
  };

  const handleCancelPlanConfirm = async () => {
    if (!selectedPlan) return;
    
    const [patientId, paymentLinkId] = selectedPlan.id.split('_');
    const success = await handleCancelPlanOperation(patientId, paymentLinkId);
    
    if (success) {
      setShowCancelDialog(false);
      setShowPlanDetails(false);
    }
  };

  return {
    showCancelDialog,
    setShowCancelDialog,
    handleOpenCancelDialog,
    handleCancelPlan: handleCancelPlanConfirm
  };
};
