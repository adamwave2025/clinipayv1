import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { toast } from 'sonner';

export const usePlanCancelActions = (
  selectedPlan: Plan | null,
  setShowPlanDetails: (show: boolean) => void,
  refreshPlanState?: (planId: string) => Promise<void>
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
        
        // Keep the drawer open but refresh the plan data
        if (refreshPlanState) {
          await refreshPlanState(selectedPlan.id);
        }
        
        // Don't close the plan details modal anymore
        // setShowPlanDetails(false); 
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
