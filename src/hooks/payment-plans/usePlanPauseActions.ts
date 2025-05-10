
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { toast } from 'sonner';

export const usePlanPauseActions = (
  selectedPlan: Plan | null,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenPauseDialog = () => {
    setShowPauseDialog(true);
  };

  const handlePausePlan = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    try {
      // Use the consolidated PlanOperationsService directly
      const success = await PlanOperationsService.pausePlan(selectedPlan);
      
      if (success) {
        toast.success('Payment plan paused successfully');
        setShowPauseDialog(false);
        setShowPlanDetails(false); // Close the plan details modal
        return { success: true };
      } else {
        toast.error('Failed to pause payment plan');
        return { success: false };
      }
    } catch (error) {
      console.error('Error pausing plan:', error);
      toast.error('Failed to pause payment plan');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    showPauseDialog,
    setShowPauseDialog,
    handlePausePlan,
    handleOpenPauseDialog,
    isProcessing
  };
};
