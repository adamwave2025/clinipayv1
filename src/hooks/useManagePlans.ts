
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/utils/planTypes';
import { usePlanDataFetcher } from './payment-plans/usePlanDataFetcher';
import { usePlanActions } from './payment-plans/usePlanActions';
import { usePlanDetailsView } from './payment-plans/usePlanDetailsView';
import { usePlanCancelActions } from './payment-plans/usePlanCancelActions';
import { usePlanPauseActions } from './payment-plans/usePlanPauseActions';
import { usePlanResumeActions } from './payment-plans/usePlanResumeActions';
import { usePlanRescheduleActions } from './payment-plans/usePlanRescheduleActions';
import { ManagePlansContextType } from '@/contexts/ManagePlansContext';
import { useSearchFilterState } from './payment-plans/useSearchFilterState';
import { useRefundState } from './payment-plans/useRefundState';
import { useViewModeState } from './payment-plans/useViewModeState';
import { useEnhancedNavigation } from './payment-plans/useEnhancedNavigation';
import { useInstallmentHandler } from './payment-plans/useInstallmentHandler';

export const useManagePlans = (): ManagePlansContextType => {
  const { user } = useAuth();
  
  // Use all the smaller hooks
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter } = useSearchFilterState();
  const { isViewMode, setIsViewMode, handleCreatePlanClick, handleViewPlansClick } = useEnhancedNavigation();
  const { 
    refundDialogOpen, setRefundDialogOpen, paymentToRefund,
    openRefundDialog, processRefund 
  } = useRefundState();
  
  const { 
    plans: allPlans, 
    installments, 
    activities,
    isLoading, 
    isLoadingActivities,
    fetchPaymentPlans, 
    fetchPlanInstallmentsData 
  } = usePlanDataFetcher();
  
  const {
    selectedInstallment,
    setSelectedInstallment,
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    handleViewPaymentDetails
  } = useInstallmentHandler();
  
  // Use plan details view hook
  const { 
    selectedPlan, 
    setSelectedPlan,
    showPlanDetails, 
    setShowPlanDetails,
    isPlanPaused,
    handleViewPlanDetails: viewPlanDetails,
    handleBackToPlans
  } = usePlanDetailsView();
  
  // Pass fetchPaymentPlans directly as it returns Promise<Plan[]>
  const { 
    isProcessing,
    handleSendReminder: sendReminder, 
    handleCancelPlan: cancelPlan, 
    handlePausePlan: pausePlan,
    handleResumePlan: resumePlan,
    handleReschedulePlan: reschedulePlan
  } = usePlanActions(() => fetchPaymentPlans(user?.id || ''));
  
  // Use specialized action hooks
  const cancelActions = usePlanCancelActions(selectedPlan, cancelPlan, setShowPlanDetails);
  const pauseActions = usePlanPauseActions(selectedPlan, pausePlan, setShowPlanDetails);
  const resumeActions = usePlanResumeActions(selectedPlan, resumePlan, setShowPlanDetails);
  const rescheduleActions = usePlanRescheduleActions(selectedPlan, reschedulePlan, setShowPlanDetails);

  // Apply filters to get the filtered plans
  const plans = useMemo(() => {
    let filtered = [...allPlans];
    
    // First apply status filter if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan => plan.status === statusFilter);
    }
    
    // Then apply search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(plan => 
        plan.patientName.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allPlans, statusFilter, searchQuery]);

  // Fetch payment plans on mount
  useEffect(() => {
    if (user) {
      fetchPaymentPlans(user.id);
    }
  }, [user]);

  const handleViewPlanDetails = async (plan: Plan) => {
    return viewPlanDetails(plan, fetchPlanInstallmentsData);
  };

  // Create a wrapper for sendReminder that adapts the return type
  const handleSendReminder = async (installmentId: string): Promise<void> => {
    await sendReminder(installmentId);
    // Void return type, so no return statement needed
  };

  // Override the refund functionality to handle the payment details view
  const enhancedOpenRefundDialog = () => {
    openRefundDialog(paymentData);
    // We'll close the payment details modal after refund in processRefund
  };

  return {
    // Search and filter state
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    
    // Plan data
    plans,
    allPlans, // Now we expose allPlans in the return object
    isLoading,
    installments,
    activities,
    isLoadingActivities,
    
    // Selected plan state
    selectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    
    // Payment details state
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    selectedInstallment,
    
    // View mode state
    isViewMode,
    setIsViewMode,
    
    // Action handlers
    handleViewPlanDetails,
    handleCreatePlanClick,
    handleViewPlansClick,
    handleSendReminder,
    handleViewPaymentDetails,
    handleBackToPlans,
    
    // Refund properties
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    openRefundDialog: enhancedOpenRefundDialog,
    processRefund,
    
    // Include all plan action properties
    ...cancelActions,
    ...pauseActions,
    ...resumeActions,
    ...rescheduleActions,
    
    // Plan state helpers
    isPlanPaused,
    isProcessing
  };
};
