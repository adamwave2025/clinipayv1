
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
    await handleViewPlanDetails(plan, fetchPlanInstallmentsData);
  };
  
  // Dummy functions for safety
  const dummyPlanAction = async () => {
    console.log("This action is not implemented yet");
  };
  
  // Since we're not focusing on plan-level actions yet, set all to dummyPlanAction
  const showCancelDialog = false;
  const setShowCancelDialog = () => {};
  const showPauseDialog = false;
  const setShowPauseDialog = () => {};
  const showResumeDialog = false;
  const setShowResumeDialog = () => {};
  const hasSentPayments = false;
  const hasOverduePayments = false;
  const hasPaidPayments = false; // Add this property
  const showRescheduleDialog2 = false;
  const setShowRescheduleDialog2 = () => {};
  const refundDialogOpen = false;
  const setRefundDialogOpen = () => {};
  const paymentToRefund = null;
  const handleCancelPlan = dummyPlanAction;
  const handlePausePlan = dummyPlanAction;
  const handleResumePlan = async () => {};
  const handleReschedulePlan = async () => {};
  const processRefund = async () => {};
  const openRefundDialog = () => {};
  const handleSendReminder = async () => {};

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
        handleOpenCancelDialog: () => {},
        
        showPauseDialog,
        setShowPauseDialog,
        handlePausePlan,
        handleOpenPauseDialog: () => {},
        
        showResumeDialog,
        setShowResumeDialog,
        handleResumePlan,
        handleOpenResumeDialog: () => {},
        hasSentPayments,
        
        showRescheduleDialog,
        setShowRescheduleDialog,
        handleReschedulePlan,
        handleOpenRescheduleDialog: () => {},
        hasOverduePayments,
        hasPaidPayments, // Add this property
        
        // Plan state helpers
        isPlanPaused,
        isProcessing,
        resumeError: null
      }}
    >
      {children}
    </ManagePlansContext.Provider>
  );
};

export default ManagePlansProvider;
