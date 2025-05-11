
import { useMemo } from 'react';
import { Plan } from '@/utils/planTypes';
import { ManagePlansContextType } from '@/contexts/ManagePlansContext';
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
  
  // Use installment handlers
  const {
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    selectedInstallment,
    setSelectedInstallment,
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
    showTakePaymentDialog, // Include these properties from the hook
    setShowTakePaymentDialog,
    rescheduleDialog: installmentRescheduleDialog,
    setRescheduleDialog: setInstallmentRescheduleDialog,
    handleReschedulePayment: installmentReschedulePayment
  } = useInstallmentActions(selectedPlan?.id || '', refreshInstallments);
  
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
    onPaymentUpdated,  // Add this missing property
    
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
