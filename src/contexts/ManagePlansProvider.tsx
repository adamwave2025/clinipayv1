
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
import { usePlanResumeActions } from '@/hooks/payment-plans/usePlanResumeActions';
import { usePlanRescheduleActions } from '@/hooks/payment-plans/usePlanRescheduleActions';

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
  
  // Add state for template view
  const [isTemplateView, setIsTemplateView] = useState(false);
  
  // Create a refresh function for use after operations
  const refreshData = async () => {
    if (user) {
      await fetchPaymentPlans(user.id);
    }
  };
  
  // Use plan details view hook
  const { 
    selectedPlan, 
    setSelectedPlan,
    showPlanDetails, 
    setShowPlanDetails,
    isPlanPaused,
    handleViewPlanDetails: viewPlanDetailsHook,
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
    handleReschedulePayment,
    handleTakePayment,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid
  } = useInstallmentActions(
    selectedPlan?.id || '',
    async () => {
      if (selectedPlan) {
        await fetchPlanInstallmentsData(selectedPlan.id);
      }
    }
  );
  
  // Use the plan reschedule hook with the setIsTemplateView function
  const rescheduleActions = usePlanRescheduleActions(
    selectedPlan, 
    setShowPlanDetails, 
    refreshData,
    setIsTemplateView  // Pass setIsTemplateView to the hook
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
  const handleViewPlanDetails = async (plan: Plan) => {
    console.log("ManagePlansProvider: Viewing plan details for:", plan.id, plan.title || plan.planName);
    await viewPlanDetailsHook(plan, fetchPlanInstallmentsData);
  };
  
  // For debugging
  useEffect(() => {
    console.log("ManagePlansProvider: Plan details state changed:", { 
      showPlanDetails, 
      selectedPlan: selectedPlan?.id,
      isTemplateView
    });
  }, [showPlanDetails, selectedPlan, isTemplateView]);
  
  // Set up properties for plan action dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  
  // Use the improved resume actions hook
  const { 
    showResumeDialog, 
    setShowResumeDialog, 
    handleResumePlan, 
    handleOpenResumeDialog,
    hasSentPayments,
    hasOverduePayments,
    hasPaidPayments,
    resumeError
  } = usePlanResumeActions(selectedPlan, setShowPlanDetails, refreshData);
  
  // Open dialog handlers
  const handleOpenCancelDialog = () => {
    console.log("Opening cancel dialog");
    setShowCancelDialog(true);
  };
  
  const handleOpenPauseDialog = () => {
    console.log("Opening pause dialog");
    setShowPauseDialog(true);
  };
  
  const openRefundDialog = () => {
    console.log("Opening refund dialog");
    setRefundDialogOpen(true);
  };
  
  // Action handlers
  const handleCancelPlan = async () => {
    console.log("Cancel plan action called");
    setShowCancelDialog(false);
    // Always reset to patient plans view after operations
    setIsTemplateView(false);
  };
  
  const handlePausePlan = async () => {
    console.log("Pause plan action called");
    setShowPauseDialog(false);
    // Always reset to patient plans view after operations
    setIsTemplateView(false);
  };
  
  // Create a handler that returns to patient plans view after reschedule
  const handleReschedulePlan = async (newStartDate: Date) => {
    await rescheduleActions.handleReschedulePlan(newStartDate);
    // The reschedule hook will now handle setIsTemplateView
  };
  
  // Create a wrapper function that adapts the signature
  const handleOpenRescheduleDialog = () => {
    rescheduleActions.handleOpenRescheduleDialog();
  };
  
  const processRefund = async () => {
    console.log("Process refund action called");
    setRefundDialogOpen(false);
    // Always reset to patient plans view after operations
    setIsTemplateView(false);
  };
  
  const handleSendReminder = async () => {
    console.log("Send reminder action called");
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
        handleViewPlanDetails,
        handleCreatePlanClick,
        handleViewPlansClick,
        handleSendReminder,
        handleViewPaymentDetails,
        handleBackToPlans,
        
        // Individual payment actions
        handleMarkAsPaid,
        handleOpenReschedule,
        handleReschedulePayment,
        handleTakePayment,
        
        // Add Mark as Paid confirmation dialog properties
        showMarkAsPaidDialog,
        setShowMarkAsPaidDialog,
        confirmMarkAsPaid,
        
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
        
        // Use reschedule actions from the hook
        showRescheduleDialog: rescheduleActions.showRescheduleDialog,
        setShowRescheduleDialog: rescheduleActions.setShowRescheduleDialog,
        handleReschedulePlan,
        handleOpenRescheduleDialog,
        hasOverduePayments,
        hasPaidPayments,
        
        // Plan state helpers
        isPlanPaused,
        isProcessing: isProcessing || rescheduleActions.isProcessing,
        resumeError
      }}
    >
      {children}
    </ManagePlansContext.Provider>
  );
};

export default ManagePlansProvider;
