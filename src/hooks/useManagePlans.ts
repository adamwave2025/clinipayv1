import { useMemo, useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { ManagePlansContextType, PaymentDialogData } from '@/contexts/ManagePlansContext';
import { usePlanCore } from './payment-plans/usePlanCore';
import { usePlanFiltering } from './payment-plans/usePlanFiltering';
import { useActionHandlers } from './payment-plans/useActionHandlers';
import { useDialogHandlers } from './payment-plans/useDialogHandlers';
import { useInstallmentHandler } from './payment-plans/useInstallmentHandler';
import { useInstallmentActions } from './payment-plans/useInstallmentActions';
import { usePlanCancelActions } from './payment-plans/usePlanCancelActions';
import { usePlanPauseActions } from './payment-plans/usePlanPauseActions';
import { usePlanResumeActions } from './payment-plans/usePlanResumeActions';
import { usePlanRescheduleActions } from './payment-plans/usePlanRescheduleActions';
import { usePaymentRescheduleActions } from './payment-plans/usePaymentRescheduleActions';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { toast } from '@/hooks/use-toast';

export const useManagePlans = (): ManagePlansContextType => {
  // Use the core plan management hook
  const {
    allPlans,
    installments,
    activities,
    isLoading,
    isLoadingActivities,
    fetchPaymentPlans,
    fetchPlanInstallmentsData,
    hasOverduePayments,
    hasPaidPayments,
    refreshData,
    user
  } = usePlanCore();
  
  // Use the filtering hook
  const {
    plans,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter
  } = usePlanFiltering(allPlans);
  
  // Use action handlers with properly typed function params
  const {
    selectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    isProcessing: isProcessingActions,
    isPlanPaused,
    handleViewPlanDetails,
    handleSendReminder,
    handleBackToPlans
  } = useActionHandlers(fetchPaymentPlans, fetchPlanInstallmentsData);
  
  // Use dialog handlers
  const {
    isViewMode,
    setIsViewMode,
    handleCreatePlanClick,
    handleViewPlansClick,
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    openRefundDialog,
    processRefund
  } = useDialogHandlers();
  
  // Use installment handlers - update variable name to match the context
  const {
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    selectedInstallment: viewDetailsInstallment, // Renamed to avoid conflict
    setSelectedInstallment: setViewDetailsInstallment,
    handleViewPaymentDetails
  } = useInstallmentHandler();
  
  // Create a refresh function for installments
  const refreshInstallments = async () => {
    if (selectedPlan) {
      await fetchPlanInstallmentsData(selectedPlan.id);
    }
  };
  
  // Create the onPaymentUpdated function that will be used after payment processing
  const onPaymentUpdated = async () => {
    console.log("Payment updated, refreshing installments data");
    await refreshInstallments();
  };
  
  // Use installment actions with all needed props
  const {
    isProcessing: isProcessingInstallment,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleTakePayment,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    rescheduleDialog: installmentRescheduleDialog,
    setRescheduleDialog: setInstallmentRescheduleDialog,
    handleReschedulePayment: installmentReschedulePayment,
    selectedInstallment, // This is the primary selectedInstallment
    setSelectedInstallment
  } = useInstallmentActions(selectedPlan?.id || '', refreshInstallments);
  
  // Add state for payment dialog data
  const [paymentDialogData, setPaymentDialogData] = useState<PaymentDialogData | null>(null);
  
  // Add function to prepare and validate payment data
  const preparePaymentData = (paymentId: string, installmentDetails: PlanInstallment): boolean => {
    console.log("useManagePlans: Preparing payment data for:", paymentId);
    
    try {
      // Validate the payment ID
      if (!paymentId || paymentId.trim() === '') {
        console.error("useManagePlans: Invalid or empty payment ID provided");
        toast.error("Cannot process payment: Missing payment ID");
        return false;
      }

      // Validate the installment data
      if (!installmentDetails || typeof installmentDetails !== 'object') {
        console.error("useManagePlans: Invalid installment details provided:", installmentDetails);
        toast.error("Cannot process payment: Missing installment details");
        return false;
      }
      
      if (!installmentDetails.amount || typeof installmentDetails.amount !== 'number') {
        console.error("useManagePlans: Invalid amount in installment:", installmentDetails);
        toast.error("Cannot process payment: Invalid payment amount");
        return false;
      }
      
      if (!selectedPlan) {
        console.error("useManagePlans: No selected plan available for payment");
        toast.error("Cannot process payment: No plan selected");
        return false;
      }
      
      // Create the validated dialog data
      const newPaymentData: PaymentDialogData = {
        paymentId: paymentId.trim(),
        patientName: selectedPlan.patientName || '',
        patientEmail: selectedPlan.patientEmail || '',
        patientPhone: selectedPlan.patients?.phone || '',
        amount: installmentDetails.amount,
        isValid: true
      };
      
      console.log("useManagePlans: Setting validated payment dialog data:", newPaymentData);
      
      // Set the validated data
      setPaymentDialogData(newPaymentData);
      return true;
    } catch (error) {
      console.error("useManagePlans: Error preparing payment data:", error);
      toast.error("Failed to prepare payment data");
      return false;
    }
  };
  
  // Use specialized action hooks
  const cancelActions = usePlanCancelActions(selectedPlan, setShowPlanDetails);
  const pauseActions = usePlanPauseActions(selectedPlan, setShowPlanDetails, refreshData);
  const resumeActions = usePlanResumeActions(selectedPlan, setShowPlanDetails, refreshData);
  const rescheduleActions = usePlanRescheduleActions(selectedPlan, setShowPlanDetails, refreshData);
  
  // Override the refund functionality to handle the payment details view
  const enhancedOpenRefundDialog = () => {
    openRefundDialog(paymentData);
    // We'll close the payment details modal after refund in processRefund
  };

  // Log dialog states for debugging
  console.log('useManagePlans - Dialog states:', {
    showMarkAsPaidDialog,
    showTakePaymentDialog,
    selectedInstallment,
    installmentRescheduleDialog,
    showRescheduleDialog: rescheduleActions.showRescheduleDialog
  });

  return {
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
    
    // Payment details state - use renamed property
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    viewDetailsInstallment, // Renamed from selectedInstallment
    
    // Add the payment dialog data and related functions
    paymentDialogData,
    setPaymentDialogData,
    preparePaymentData,
    
    // View mode state
    isViewMode,
    setIsViewMode,
    
    // Action handlers
    handleViewPlanDetails,
    handleCreatePlanClick,
    handleViewPlansClick,
    handleSendReminder,
    handleBackToPlans,
    
    // Include handleViewPaymentDetails which was missing
    handleViewPaymentDetails,
    
    // Installment action handlers
    handleMarkAsPaid,
    handleOpenReschedule,
    handleTakePayment,
    
    // Mark as paid dialog state and handlers
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    
    // Take payment dialog state and handlers
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    onPaymentUpdated,
    
    // Add the primary selected installment state (for payment actions)
    selectedInstallment,
    
    // Refund properties
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    openRefundDialog: enhancedOpenRefundDialog,
    processRefund,
    
    // Payment rescheduling dialog properties - use values from installment actions
    showReschedulePaymentDialog: installmentRescheduleDialog,
    setShowReschedulePaymentDialog: setInstallmentRescheduleDialog,
    handleReschedulePayment: installmentReschedulePayment,
    
    // Include all plan action properties but avoid using handleReschedulePayment again
    ...cancelActions,
    ...pauseActions,
    ...resumeActions,
    // Make sure we're not including any properties that would conflict with what we've already defined
    ...{
      showRescheduleDialog: rescheduleActions.showRescheduleDialog,
      setShowRescheduleDialog: rescheduleActions.setShowRescheduleDialog,
      handleReschedulePlan: rescheduleActions.handleReschedulePlan,
      handleOpenRescheduleDialog: rescheduleActions.handleOpenRescheduleDialog
    },
    
    // Add hasOverduePayments and hasPaidPayments
    hasOverduePayments,
    hasPaidPayments,
    
    // Add resumeError from resumeActions
    resumeError: resumeActions.resumeError,
    
    // Plan state helpers
    isPlanPaused,
    isProcessing: isProcessingActions || isProcessingInstallment
  };
};
