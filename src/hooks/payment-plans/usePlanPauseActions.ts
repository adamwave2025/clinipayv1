
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { PlanStatusService } from '@/services/PlanStatusService';
import { toast } from 'sonner';

export const usePlanPauseActions = (
  selectedPlan: Plan | null,
  setShowPlanDetails: (show: boolean) => void,
  refreshData?: () => Promise<void>
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
      // Use the consolidated PlanOperationsService
      const success = await PlanOperationsService.pausePlan(selectedPlan);
      
      if (success) {
        // Get the updated status from the service
        const { status } = await PlanStatusService.refreshPlanStatus(selectedPlan.id);
        
        // Refresh all plans data to update UI
        if (refreshData) {
          await refreshData();
        }
        
        toast.success('Payment plan paused successfully');
        setShowPauseDialog(false);
        setShowPlanDetails(false); // Close the plan details modal
      } else {
        toast.error('Failed to pause payment plan');
      }
    } catch (error) {
      console.error('Error pausing plan:', error);
      toast.error('Failed to pause payment plan');
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
