import { useEffect, useMemo, useState } from 'react';
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
import { useInstallmentActions } from './payment-plans/useInstallmentActions';

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
    handleViewPlanDetails: viewPlanDetails,
    handleBackToPlans
  } = usePlanDetailsView();
  
  // Use installment actions hook
  const {
    isProcessing: isProcessingInstallment,
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
  
  // Pass fetchPaymentPlans directly as it returns Promise<Plan[]>
  const { 
    isProcessing,
    handleSendReminder: sendReminder
  } = usePlanActions(() => fetchPaymentPlans(user?.id || ''));
  
  // Use specialized action hooks with refresh capability
  const cancelActions = usePlanCancelActions(selectedPlan, setShowPlanDetails);
  const pauseActions = usePlanPauseActions(selectedPlan, setShowPlanDetails, refreshData); // Pass refreshData here
  const resumeActions = usePlanResumeActions(selectedPlan, setShowPlanDetails, refreshData);
  const rescheduleActions = usePlanRescheduleActions(selectedPlan, setShowPlanDetails);
  
  // Add the hasPaidPayments state explicitly
  const [hasPaidPayments, setHasPaidPayments] = useState(false);
  
  // Update the hasPaidPayments state when installments change
  useEffect(() => {
    if (installments.length > 0) {
      const hasPaid = installments.some(installment => installment.status === 'paid');
      setHasPaidPayments(hasPaid);
    }
  }, [installments]);

  // Apply filters to get the filtered plans
  const plans = useMemo(() => {
    console.log('Filtering plans. All plans:', allPlans.length);
    console.log('Status filter:', statusFilter);
    console.log('Search query:', searchQuery);
    
    let filtered = [...allPlans];
    
    // First apply status filter if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan => plan.status === statusFilter);
    }
    
    // Then apply search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(plan => {
        // Use patientName directly instead of checking nested properties
        const patientName = plan.patientName || '';
        return patientName.toLowerCase().includes(query);
      });
    }
    
    console.log('Filtered plans:', filtered.length);
    return filtered;
  }, [allPlans, statusFilter, searchQuery]);

  // Fetch payment plans on mount
  useEffect(() => {
    if (user) {
      console.log('Fetching payment plans for user:', user.id);
      fetchPaymentPlans(user.id);
    }
  }, [user, fetchPaymentPlans]);

  const handleViewPlanDetails = async (plan: Plan) => {
    console.log('useManagePlans.handleViewPlanDetails called with plan:', plan.id);
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
    
    // Add installment action handlers
    handleMarkAsPaid,
    handleOpenReschedule,
    handleReschedulePayment,
    
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
    
    // Explicitly add hasOverduePayments from rescheduleActions
    hasOverduePayments: resumeActions.hasOverduePayments,
    
    // Add resumeError from resumeActions
    resumeError: resumeActions.resumeError,
    
    // Add hasPaidPayments explicitly
    hasPaidPayments,
    
    // Plan state helpers
    isPlanPaused,
    isProcessing: isProcessing || isProcessingInstallment
  };
};
