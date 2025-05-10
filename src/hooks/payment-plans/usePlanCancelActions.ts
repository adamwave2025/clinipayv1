
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { toast } from 'sonner';

export const usePlanCancelActions = (
  selectedPlan: Plan | null,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
  };

  const handleCancelPlan = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    try {
      // Use the consolidated PlanOperationsService directly
      const success = await PlanOperationsService.cancelPlan(selectedPlan);
      
      if (success) {
        toast.success('Payment plan cancelled successfully');
        setShowCancelDialog(false);
        setShowPlanDetails(false); // Close the plan details modal
      } else {
        toast.error('Failed to cancel payment plan');
      }
    } catch (error) {
      console.error('Error cancelling plan:', error);
      toast.error('Failed to cancel payment plan');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan,
    handleOpenCancelDialog,
    isProcessing
  };
};
