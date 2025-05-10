
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
  
  // Function to handle viewing plan details - key function that needs fixing
  const handleViewPlanDetails = async (plan: Plan) => {
    console.log("ManagePlansProvider: Viewing plan details for:", plan.id, plan.title || plan.planName);
    await viewPlanDetailsHook(plan, fetchPlanInstallmentsData);
    console.log("After viewPlanDetailsHook, showPlanDetails:", showPlanDetails, "selectedPlan:", selectedPlan?.id);
  };
  
  // For debugging
  useEffect(() => {
    console.log("ManagePlansProvider: Plan details state changed:", { 
      showPlanDetails, 
      selectedPlan: selectedPlan?.id 
    });
  }, [showPlanDetails, selectedPlan]);
  
  // Set up properties for plan action dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasSentPayments, setHasSentPayments] = useState(false);
  const [hasOverduePayments, setHasOverduePayments] = useState(false);
  const [hasPaidPayments, setHasPaidPayments] = useState(false); 
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  
  // Open dialog handlers
  const handleOpenCancelDialog = () => {
    console.log("Opening cancel dialog");
    setShowCancelDialog(true);
  };
  
  const handleOpenPauseDialog = () => {
    console.log("Opening pause dialog");
    setShowPauseDialog(true);
  };
  
  const handleOpenResumeDialog = () => {
    console.log("Opening resume dialog");
    setShowResumeDialog(true);
  };
  
  const handleOpenRescheduleDialog = () => {
    console.log("Opening reschedule dialog");
    setShowRescheduleDialog(true);
  };

  const openRefundDialog = () => {
    console.log("Opening refund dialog");
    setRefundDialogOpen(true);
  };
  
  // Action handlers
  const handleCancelPlan = async () => {
    console.log("Cancel plan action called");
    setShowCancelDialog(false);
    // Actual implementation would go here
  };
  
  const handlePausePlan = async () => {
    console.log("Pause plan action called");
    setShowPauseDialog(false);
    // Actual implementation would go here
  };
  
  const handleResumePlan = async () => {
    console.log("Resume plan action called");
    setShowResumeDialog(false);
    // Actual implementation would go here
  };
  
  const handleReschedulePlan = async () => {
    console.log("Reschedule plan action called");
    setShowRescheduleDialog(false);
    // Actual implementation would go here
  };
  
  const processRefund = async () => {
    console.log("Process refund action called");
    setRefundDialogOpen(false);
    // Actual implementation would go here
  };
  
  const handleSendReminder = async () => {
    console.log("Send reminder action called");
    // Actual implementation would go here
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
