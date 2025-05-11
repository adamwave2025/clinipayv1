
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
  
  // Use action handlers
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
  
  // Use installment actions
  const {
    isProcessing: isProcessingInstallment,
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleReschedulePayment,
    handleTakePayment,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid
  } = useInstallmentActions(selectedPlan?.id || '', refreshInstallments);
  
  // Use payment reschedule actions for individual payments
  const {
    showRescheduleDialog: showReschedulePaymentDialog,
    setShowRescheduleDialog: setShowReschedulePaymentDialog,
    handleReschedulePayment: handleRescheduleIndividualPayment,
  } = usePaymentRescheduleActions(selectedPlan?.id || '', refreshInstallments);
  
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
    selectedInstallment,
    showRescheduleDialog,
    showReschedulePaymentDialog
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
    handleViewPaymentDetails,
    handleBackToPlans,
    
    // Installment action handlers
    handleMarkAsPaid,
    handleOpenReschedule,
    handleReschedulePayment,
    handleTakePayment,
    
    // Mark as paid dialog state and handlers
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    
    // Refund properties
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    openRefundDialog: enhancedOpenRefundDialog,
    processRefund,
    
    // Payment rescheduling dialog properties
    showReschedulePaymentDialog,
    setShowReschedulePaymentDialog,
    
    // Include all plan action properties
    ...cancelActions,
    ...pauseActions,
    ...resumeActions,
    ...rescheduleActions,
    
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
