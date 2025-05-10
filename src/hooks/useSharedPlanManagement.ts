
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { PlanActivity } from '@/utils/planActivityUtils';
import { PlanDataService } from '@/services/PlanDataService';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { isPlanPaused, validatePlanStatus } from '@/utils/plan-status-utils';
import { supabase } from '@/integrations/supabase/client';
import { PlanStatusService } from '@/services/PlanStatusService';

/**
 * Shared hook to manage payment plan operations across different parts of the application.
 * This consolidates plan management logic so it can be reused in both the main plans area
 * and the patient details area.
 */
export const useSharedPlanManagement = () => {
  // Plan and related data state
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planInstallments, setPlanInstallments] = useState<PlanInstallment[]>([]);
  const [planActivities, setPlanActivities] = useState<PlanActivity[]>([]);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  // UI state
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  // State to track sent payments during resume operations
  const [hasSentPayments, setHasSentPayments] = useState(false);

  /**
   * View plan details and fetch related data
   */
  const handleViewPlanDetails = async (plan: Plan) => {
    setSelectedPlan(plan);
    await fetchPlanDetails(plan);
    setShowPlanDetails(true);
  };
  
  /**
   * Fetch both installments and activities for a plan
   */
  const fetchPlanDetails = async (plan: Plan) => {
    setIsLoadingInstallments(true);
    setIsLoadingActivities(true);
    
    try {
      const { installments, activities } = await PlanDataService.fetchPlanDetails(plan);
      setPlanInstallments(installments);
      setPlanActivities(activities);
    } catch (err) {
      console.error('Error fetching plan details:', err);
    } finally {
      setIsLoadingInstallments(false);
      setIsLoadingActivities(false);
    }
  };

  /**
   * Refresh plan details after modifications
   */
  const refreshPlanDetails = async () => {
    if (selectedPlan) {
      await fetchPlanDetails(selectedPlan);
    }
  };

  // Dialog opening handlers
  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
    setShowPlanDetails(false);
  };
  
  const handleOpenPauseDialog = () => {
    setShowPauseDialog(true);
    setShowPlanDetails(false);
  };
  
  const handleOpenResumeDialog = async () => {
    // Check if there are any paused payments that were previously in 'sent' status
    if (selectedPlan) {
      const { data: sentPayments } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused')
        .not('payment_request_id', 'is', null);
      
      const hasSentPayments = sentPayments && sentPayments.length > 0;
      
      // Store this information in state to use in the dialog
      setHasSentPayments(hasSentPayments);
    }
    
    setShowResumeDialog(true);
  };
  
  const handleOpenRescheduleDialog = () => {
    setShowRescheduleDialog(true);
    setShowPlanDetails(false);
  };

  /**
   * Cancel the current plan
   */
  const handleCancelPlan = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
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
    } finally {
      setIsProcessing(false);
      setShowCancelDialog(false);
    }
  };
  
  /**
   * Pause the current plan
   */
  const handlePausePlan = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
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
    } finally {
      setIsProcessing(false);
      setShowPauseDialog(false);
    }
  };
  
  /**
   * Resume the current plan
   */
  const handleResumePlan = async (resumeDate?: Date) => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
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
      setShowResumeDialog(false);
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
      
      const success = await PlanOperationsService.reschedulePlan(selectedPlan, newStartDate);
      
      if (success) {
        // After successful reschedule, fetch the updated plan data to get correct status
        const { status } = await PlanStatusService.refreshPlanStatus(selectedPlan.id);
        
        // Get updated plan details
        const { data: updatedPlan, error } = await supabase
          .from('plans')
          .select('start_date, next_due_date, has_overdue_payments')
          .eq('id', selectedPlan.id)
          .single();
        
        if (error) {
          console.error('Error fetching updated plan:', error);
        } else if (updatedPlan) {
          // Update local state with the latest plan data from the server
          setSelectedPlan({
            ...selectedPlan,
            status: status || selectedPlan.status,
            hasOverduePayments: updatedPlan.has_overdue_payments,
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
      setShowRescheduleDialog(false);
    }
  };

  return {
    // Plan and related data
    selectedPlan,
    planInstallments,
    planActivities,
    isLoadingInstallments,
    isLoadingActivities,
    
    // UI state
    showPlanDetails,
    setShowPlanDetails,
    
    // Dialog states
    showCancelDialog,
    setShowCancelDialog,
    showPauseDialog,
    setShowPauseDialog,
    showResumeDialog,
    setShowResumeDialog,
    showRescheduleDialog,
    setShowRescheduleDialog,
    
    // Plan view handlers
    handleViewPlanDetails,
    refreshPlanDetails,
    
    // Dialog opening handlers
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
    handleOpenRescheduleDialog,
    
    // Plan operation handlers
    handleCancelPlan,
    handlePausePlan,
    handleResumePlan,
    handleReschedulePlan,
    
    // Status helpers
    isPlanPaused,
    isProcessing,
    
    // State to track sent payments during resume operations
    hasSentPayments
  };
};
