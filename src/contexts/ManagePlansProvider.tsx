
import React, { useState, useEffect } from 'react';
import ManagePlansContext, { PaymentDialogData } from './ManagePlansContext';
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
import { usePaymentRescheduleActions } from '@/hooks/payment-plans/usePaymentRescheduleActions';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { toast } from '@/hooks/use-toast';

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
    selectedInstallment: viewDetailsSelectedInstallment,  // Rename to avoid conflict
    handleViewPaymentDetails
  } = useInstallmentHandler();
  
  // Create a refresh function for installment data
  const refreshInstallments = async () => {
    if (selectedPlan) {
      await fetchPlanInstallmentsData(selectedPlan.id);
    }
  };
  
  // Define onPaymentUpdated function for the take payment dialog
  const onPaymentUpdated = async () => {
    console.log("Payment updated, refreshing installments data");
    await refreshInstallments();
  };
  
  // Add new state for payment dialog data - simplified to just track the ID
  const [paymentDialogData, setPaymentDialogData] = useState<PaymentDialogData | null>(null);
  
  // Simplify the preparePaymentData function - it now only needs to store basic information 
  // since the dialog will handle most validation internally
  const preparePaymentData = (paymentId: string, installmentDetails: PlanInstallment): boolean => {
    console.log("Preparing payment data for:", paymentId);
    
    try {
      // Validate the payment ID
      if (!paymentId || paymentId.trim() === '') {
        console.error("Invalid or empty payment ID provided");
        toast.error("Cannot process payment: Missing payment ID");
        return false;
      }

      // Only validate that we have a selected plan and an installment with an amount
      if (!selectedPlan) {
        console.error("No selected plan available for payment");
        toast.error("Cannot process payment: No plan selected");
        return false;
      }
      
      if (!installmentDetails || typeof installmentDetails !== 'object') {
        console.error("Invalid installment details provided:", installmentDetails);
        toast.error("Cannot process payment: Missing installment details");
        return false;
      }

      if (!installmentDetails.amount || typeof installmentDetails.amount !== 'number') {
        console.error("Invalid amount in installment:", installmentDetails);
        toast.error("Cannot process payment: Missing payment amount");
        return false;
      }
      
      // Create simpler dialog data - the dialog will handle most of the validation
      const newPaymentData: PaymentDialogData = {
        paymentId: paymentId.trim(),
        patientName: selectedPlan.patientName || '',
        patientEmail: selectedPlan.patientEmail || '',
        patientPhone: selectedPlan.patients?.phone || '',
        amount: installmentDetails.amount,
        isValid: true
      };
      
      console.log("Setting payment dialog data:", newPaymentData);
      
      // Set the data
      setPaymentDialogData(newPaymentData);
      return true;
    } catch (error) {
      console.error("Error preparing payment data:", error);
      toast.error("Failed to prepare payment data");
      return false;
    }
  };
  
  // Use installment actions hook with the refreshInstallments function
  const {
    isProcessing: isProcessingInstallment,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleTakePayment: originalHandleTakePayment,  // Rename to avoid conflict
    confirmMarkAsPaid,
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    selectedInstallment,  // This is our primary selectedInstallment state
    setSelectedInstallment
  } = useInstallmentActions(
    selectedPlan?.id || '',
    refreshInstallments
  );
  
  // Create a fixed and improved take payment handler
  const handleTakePayment = (paymentId: string, installmentDetails: PlanInstallment) => {
    console.log("Enhanced handleTakePayment called with:", paymentId, installmentDetails);
    
    // First, set the selected installment directly to ensure the dialog has the data
    setSelectedInstallment(installmentDetails);
    
    // Next, prepare the payment data
    const isValid = preparePaymentData(paymentId, installmentDetails);
    
    // Open the dialog if data validation passed
    if (isValid) {
      console.log("Opening payment dialog for:", paymentId);
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        setShowTakePaymentDialog(true);
      }, 10);
    } else {
      console.error("Failed to prepare payment data");
      toast.error("Cannot open payment dialog: Invalid data");
    }
  };
  
  // Use the plan reschedule hook with the setIsTemplateView function
  const planRescheduleActions = usePlanRescheduleActions(
    selectedPlan, 
    setShowPlanDetails, 
    refreshData,
    setIsTemplateView
  );
  
  // Use the payment reschedule hook for individual payments
  const paymentRescheduleActions = usePaymentRescheduleActions(
    selectedPlan?.id || '',
    refreshInstallments
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
    await planRescheduleActions.handleReschedulePlan(newStartDate);
    // The reschedule hook will now handle setIsTemplateView
  };
  
  // Create a wrapper function that adapts the signature
  const handleOpenRescheduleDialog = () => {
    planRescheduleActions.handleOpenRescheduleDialog();
  };
  
  // Create handler for payment rescheduling
  const handleReschedulePayment = async (newDate: Date) => {
    await paymentRescheduleActions.handleReschedulePayment(newDate);
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
        selectedInstallment: viewDetailsSelectedInstallment,
        
        // Payment dialog data
        paymentDialogData,
        setPaymentDialogData,
        
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
        preparePaymentData,
        
        // Add Mark as Paid confirmation dialog properties
        showMarkAsPaidDialog,
        setShowMarkAsPaidDialog,
        confirmMarkAsPaid,
        
        // Add Take Payment dialog properties
        showTakePaymentDialog,
        setShowTakePaymentDialog,
        onPaymentUpdated,
        selectedInstallment, // Primary selectedInstallment state (from useInstallmentActions)
        
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
        
        // Use reschedule actions from the plan reschedule hook
        showRescheduleDialog: planRescheduleActions.showRescheduleDialog,
        setShowRescheduleDialog: planRescheduleActions.setShowRescheduleDialog,
        handleReschedulePlan,
        handleOpenRescheduleDialog,
        
        // Add payment rescheduling dialog properties
        showReschedulePaymentDialog: paymentRescheduleActions.showRescheduleDialog,
        setShowReschedulePaymentDialog: paymentRescheduleActions.setShowRescheduleDialog,
        
        hasOverduePayments,
        hasPaidPayments,
        
        // Plan state helpers
        isPlanPaused,
        isProcessing: isProcessingInstallment || planRescheduleActions.isProcessing || paymentRescheduleActions.isProcessing,
        resumeError
      }}
    >
      {children}
    </ManagePlansContext.Provider>
  );
};

export default ManagePlansProvider;
