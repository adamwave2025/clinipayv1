import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { PlanStatusService } from '@/services/PlanStatusService';
import { toast } from 'sonner';

export const usePlanPauseActions = (
  selectedPlan: Plan | null,
  setShowPlanDetails: (show: boolean) => void,
  refreshPlanState?: (planId: string) => Promise<void>
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
        
        // Refresh plan data using the new refreshPlanState function if available
        if (refreshPlanState) {
          await refreshPlanState(selectedPlan.id);
        }
        
        toast.success('Payment plan paused successfully');
        setShowPauseDialog(false);
        
        // Keep the plan details modal open
        // setShowPlanDetails(false);
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
