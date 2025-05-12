
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { PlanDataService } from '@/services/PlanDataService';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { isPlanPaused } from '@/utils/plan-status-utils';
import { PlanStatusService } from '@/services/PlanStatusService';

/**
 * Hook to manage payment plan operations
 */
export const usePlanOperations = (
  selectedPlan: Plan | null,
  setSelectedPlan: (plan: Plan | null) => void,
  setIsProcessing: (processing: boolean) => void,
  setHasSentPayments: (hasSent: boolean) => void,
  setShowPlanDetails: (show: boolean) => void,
  refreshPlanDetails: () => Promise<void>
) => {
  /**
   * Cancel the current plan
   */
  const handleCancelPlan = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // Use the consolidated PlanOperationsService
      const success = await PlanOperationsService.cancelPlan(selectedPlan);
      
      if (success && selectedPlan) {
        // Get the updated status from the service
        const { status } = await PlanStatusService.refreshPlanStatus(selectedPlan.id);
        
        // Update local state to reflect the change
        setSelectedPlan({
          ...selectedPlan,
          status: status || 'cancelled'
        });
      }
    } catch (error) {
      console.error('Error in handleCancelPlan:', error);
    } finally {
      setIsProcessing(false);
      setShowPlanDetails(false);
    }
  };
  
  /**
   * Pause the current plan
   */
  const handlePausePlan = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // Use the consolidated PlanOperationsService
      const success = await PlanOperationsService.pausePlan(selectedPlan);
      
      if (success && selectedPlan) {
        // Get the updated status from the service
        const { status } = await PlanStatusService.refreshPlanStatus(selectedPlan.id);
        
        // Update local state to reflect the change
        setSelectedPlan({
          ...selectedPlan,
          status: status || 'paused'
        });
      }
    } catch (error) {
      console.error('Error in handlePausePlan:', error);
    } finally {
      setIsProcessing(false);
      setShowPlanDetails(false);
    }
  };
  
  /**
   * Resume the current plan
   */
  const handleResumePlan = async (resumeDate?: Date) => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // Use the consolidated PlanOperationsService
      const success = await PlanOperationsService.resumePlan(selectedPlan, resumeDate);
      
      if (success && selectedPlan) {
        // After successful resume, fetch the updated plan data to get correct status
        const { status } = await PlanStatusService.refreshPlanStatus(selectedPlan.id);
        
        // Update local state to reflect the change
        setSelectedPlan({
          ...selectedPlan,
          status: status || 'pending'
        });
        
        // Refresh the installments to show updated statuses
        await refreshPlanDetails();
      }
    } catch (error) {
      console.error('Error resuming plan:', error);
    } finally {
      setIsProcessing(false);
      setShowPlanDetails(false);
    }
  };
  
  /**
   * Reschedule the current plan
   */
  const handleReschedulePlan = async (newStartDate: Date) => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      console.log('Rescheduling plan with new start date:', newStartDate);
      
      // Use the consolidated PlanOperationsService
      const success = await PlanOperationsService.reschedulePlan(selectedPlan, newStartDate);
      
      if (success) {
        // After successful reschedule, fetch the updated plan data to get correct status
        const { status } = await PlanStatusService.refreshPlanStatus(selectedPlan.id);
        
        // Get updated plan details
        const { data: updatedPlan, error } = await supabase
          .from('plans')
          .select('start_date, next_due_date')
          .eq('id', selectedPlan.id)
          .single();
        
        if (error) {
          console.error('Error fetching updated plan:', error);
        } else if (updatedPlan) {
          // Update local state with the latest plan data from the server
          setSelectedPlan({
            ...selectedPlan,
            status: status || selectedPlan.status,
            startDate: updatedPlan.start_date,
            nextDueDate: updatedPlan.next_due_date
          });
        }
        
        // Refresh the installments to show updated statuses
        await refreshPlanDetails();
      }
    } catch (error) {
      console.error('Error rescheduling plan:', error);
    } finally {
      setIsProcessing(false);
      setShowPlanDetails(false);
    }
  };

  /**
   * Check for sent payments when opening resume dialog
   */
  const handleOpenResumeDialog = async () => {
    // Check if there are any paused payments that were previously in 'sent' status
    if (selectedPlan) {
      const { data: sentPayments } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused')
        .not('payment_request_id', 'is', null);
      
      const hasSent = sentPayments && sentPayments.length > 0;
      
      // Store this information in state to use in the dialog
      setHasSentPayments(hasSent);
    }
  };

  return {
    handleCancelPlan,
    handlePausePlan,
    handleResumePlan,
    handleReschedulePlan,
    handleOpenResumeDialog
  };
};
