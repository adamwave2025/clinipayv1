import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { PlanActivity } from '@/utils/planActivityUtils';

/**
 * Hook to manage the plan details state
 */
export const usePlanDetailsState = () => {
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

  return {
    // Plan and related data
    selectedPlan,
    setSelectedPlan,
    planInstallments, 
    setPlanInstallments,
    planActivities, 
    setPlanActivities,
    isLoadingInstallments, 
    setIsLoadingInstallments,
    isLoadingActivities, 
    setIsLoadingActivities,
    
    // UI state
    showPlanDetails,
    setShowPlanDetails,
    isProcessing, 
    setIsProcessing,
    
    // Dialog states
    showCancelDialog, 
    setShowCancelDialog,
    showPauseDialog, 
    setShowPauseDialog,
    showResumeDialog, 
    setShowResumeDialog,
    showRescheduleDialog, 
    setShowRescheduleDialog,
    
    // Other states
    hasSentPayments, 
    setHasSentPayments
  };
};
