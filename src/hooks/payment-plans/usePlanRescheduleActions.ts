
import { useState } from 'react';
import { Plan } from '@/utils/paymentPlanUtils';

export const usePlanRescheduleActions = (
  selectedPlan: Plan | null,
  handleReschedulePlanOperation: (patientId: string, paymentLinkId: string, newStartDate: Date) => Promise<boolean>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  const handleOpenRescheduleDialog = () => {
    setShowRescheduleDialog(true);
  };

  const handleReschedulePlan = async (newStartDate: Date) => {
    if (!selectedPlan) return;
    
    // Log the date to help with debugging
    console.log('Reschedule plan with date:', newStartDate.toISOString());
    
    const [patientId, paymentLinkId] = selectedPlan.id.split('_');
    const success = await handleReschedulePlanOperation(patientId, paymentLinkId, newStartDate);
    
    if (success) {
      setShowRescheduleDialog(false);
      setShowPlanDetails(false);
    }
  };

  return {
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleOpenRescheduleDialog,
    handleReschedulePlan // This is the correct property name with capital 'P'
  };
};
