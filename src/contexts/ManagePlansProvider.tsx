
import React, { useState, useEffect } from 'react';
import ManagePlansContext from './ManagePlansContext';
import { useAuth } from './AuthContext';
import { usePlanDataFetcher } from '@/hooks/payment-plans/usePlanDataFetcher';
import { useSearchFilterState } from '@/hooks/payment-plans/useSearchFilterState';
import { useEnhancedNavigation } from '@/hooks/payment-plans/useEnhancedNavigation';
import { Plan } from '@/utils/planTypes';
import { useViewModeState } from '@/hooks/payment-plans/useViewModeState';
import { usePlanDetailsView } from '@/hooks/payment-plans/usePlanDetailsView';
import { useInstallmentActions } from '@/hooks/payment-plans/useInstallmentActions';
import { useInstallmentHandler } from '@/hooks/payment-plans/useInstallmentHandler';

export const ManagePlansProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  
  // Use all the smaller hooks
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter } = useSearchFilterState();
  const { isViewMode, setIsViewMode, handleCreatePlanClick, handleViewPlansClick } = useEnhancedNavigation();
  
  const { 
    plans: allPlans, 
    installments, 
    activities,
    isLoading, 
    isLoadingActivities,
    fetchPaymentPlans, 
    fetchPlanInstallmentsData 
  } = usePlanDataFetcher();
  
  // Use plan details view hook
  const { 
    selectedPlan, 
    setSelectedPlan,
    showPlanDetails, 
    setShowPlanDetails,
    isPlanPaused,
    handleViewPlanDetails,
    handleBackToPlans
  } = usePlanDetailsView();

  // Use installment handler hooks
  const {
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    selectedInstallment,
    handleViewPaymentDetails
  } = useInstallmentHandler();
  
  // Use installment actions hook
  const {
    isProcessing,
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleReschedulePayment
  } = useInstallmentActions(
    selectedPlan?.id || '',
    async () => {
      if (selectedPlan) {
        await fetchPlanInstallmentsData(selectedPlan.id);
      }
    }
  );

  // Apply filters to get the filtered plans
  const [plans, setPlans] = useState<Plan[]>([]);
  
  useEffect(() => {
    // Apply filters
    let filtered = [...allPlans];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan => plan.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(plan => 
        plan.patientName?.toLowerCase().includes(query)
      );
    }
    
    setPlans(filtered);
  }, [allPlans, statusFilter, searchQuery]);

  // Fetch payment plans on mount
  useEffect(() => {
    if (user) {
      fetchPaymentPlans(user.id);
    }
  }, [user]);
  
  // Function to handle viewing plan details
  const handleViewPlanDetailsWrapper = async (plan: Plan) => {
    console.log("Viewing plan details for:", plan.id, plan.title || plan.planName);
    await handleViewPlanDetails(plan, fetchPlanInstallmentsData);
  };
  
  // Add debugging to check if plan clicking works
  useEffect(() => {
    console.log("Plan details state changed:", { 
      showPlanDetails, 
      selectedPlan: selectedPlan?.id 
    });
  }, [showPlanDetails, selectedPlan]);
  
  // Set up properties for plan actions
  // Since we're not focusing on plan-level actions yet, create minimal implementations
  const showCancelDialog = false;
  const setShowCancelDialog = () => {};
  const showPauseDialog = false;
  const setShowPauseDialog = () => {};
  const showResumeDialog = false;
  const setShowResumeDialog = () => {};
  const hasSentPayments = false;
  const hasOverduePayments = false;
  const hasPaidPayments = false; 
  const refundDialogOpen = false;
  const setRefundDialogOpen = () => {};
  const paymentToRefund = null;
  const resumeError = null;
  
  // Dummy action handlers for safety
  const handleCancelPlan = async () => {
    console.log("Cancel plan action not implemented yet");
  };
  const handlePausePlan = async () => {
    console.log("Pause plan action not implemented yet");
  };
  const handleResumePlan = async () => {
    console.log("Resume plan action not implemented yet");
  };
  const handleReschedulePlan = async () => {
    console.log("Reschedule plan action not implemented yet");
  };
  const processRefund = async () => {
    console.log("Process refund action not implemented yet");
  };
  const openRefundDialog = () => {
    console.log("Open refund dialog action not implemented yet");
  };
  const handleSendReminder = async () => {
    console.log("Send reminder action not implemented yet");
  };
  const handleOpenCancelDialog = () => {
    console.log("Open cancel dialog action not implemented yet");
  };
  const handleOpenPauseDialog = () => {
    console.log("Open pause dialog action not implemented yet");
  };
  const handleOpenResumeDialog = () => {
    console.log("Open resume dialog action not implemented yet");
  };
  const handleOpenRescheduleDialog = () => {
    console.log("Open reschedule dialog action not implemented yet");
  };

  return (
    <ManagePlansContext.Provider
      value={{
        // Search and filter state
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        
        // Plan data
        plans,
        allPlans,
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
        handleViewPlanDetails: handleViewPlanDetailsWrapper,
        handleCreatePlanClick,
        handleViewPlansClick,
        handleSendReminder,
        handleViewPaymentDetails,
        handleBackToPlans,
        
        // Individual payment actions
        handleMarkAsPaid,
        handleOpenReschedule,
        handleReschedulePayment,
        
        // Refund properties
        refundDialogOpen,
        setRefundDialogOpen,
        paymentToRefund,
        openRefundDialog,
        processRefund,
        
        // Plan action dialogs and handlers
        showCancelDialog,
        setShowCancelDialog,
        handleCancelPlan,
        handleOpenCancelDialog,
        
        showPauseDialog,
        setShowPauseDialog,
        handlePausePlan,
        handleOpenPauseDialog,
        
        showResumeDialog,
        setShowResumeDialog,
        handleResumePlan,
        handleOpenResumeDialog,
        hasSentPayments,
        
        showRescheduleDialog,
        setShowRescheduleDialog,
        handleReschedulePlan,
        handleOpenRescheduleDialog,
        hasOverduePayments,
        hasPaidPayments,
        
        // Plan state helpers
        isPlanPaused,
        isProcessing,
        resumeError
      }}
    >
      {children}
    </ManagePlansContext.Provider>
  );
};

export default ManagePlansProvider;
