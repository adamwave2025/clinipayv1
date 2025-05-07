
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { PlanActivity } from '@/utils/planActivityUtils';
import { PlanDataService } from '@/services/PlanDataService';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { isPlanPaused } from '@/utils/planStatusUtils';

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
  
  const handleOpenResumeDialog = () => {
    setShowResumeDialog(true);
    setShowPlanDetails(false);
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
        // Update local state to reflect the change
        setSelectedPlan({
          ...selectedPlan,
          status: 'cancelled'
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
        // Update local state to reflect the change
        setSelectedPlan({
          ...selectedPlan,
          status: 'paused'
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
      // Pass the resumeDate parameter to the PlanOperationsService
      const success = await PlanOperationsService.resumePlan(selectedPlan, resumeDate);
      
      if (success && selectedPlan) {
        // Update local state to reflect the change
        const newStatus = selectedPlan.hasOverduePayments ? 'overdue' : 'active';
        setSelectedPlan({
          ...selectedPlan,
          status: newStatus
        });
      }
    } finally {
      setIsProcessing(false);
      setShowResumeDialog(false);
    }
  };
  
  /**
   * Reschedule the current plan
   */
  const handleReschedulePlan = async (newStartDate: Date) => {
    // Update implementation to accept the newStartDate parameter
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // We'll implement proper rescheduling logic with the new date
      console.log('Rescheduling plan with new start date:', newStartDate);
      
      const success = await PlanOperationsService.reschedulePlan(selectedPlan, newStartDate);
      
      if (success) {
        // Update local state as needed
        console.log('Plan rescheduled successfully');
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
    isProcessing
  };
};
