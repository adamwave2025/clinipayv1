import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/utils/planTypes';
import { usePlanDataFetcher } from './payment-plans/usePlanDataFetcher';
import { usePaymentDetailsFetcher } from './payment-plans/usePaymentDetailsFetcher';
import { usePlanActions } from './payment-plans/usePlanActions';
import { usePlanUIState } from './payment-plans/usePlanUIState';
import { usePlanNavigation } from './payment-plans/usePlanNavigation';
import { usePlanDetailsView } from './payment-plans/usePlanDetailsView';
import { usePlanCancelActions } from './payment-plans/usePlanCancelActions';
import { usePlanPauseActions } from './payment-plans/usePlanPauseActions';
import { usePlanResumeActions } from './payment-plans/usePlanResumeActions';
import { usePlanRescheduleActions } from './payment-plans/usePlanRescheduleActions';
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import { ManagePlansContextType } from '@/contexts/ManagePlansContext';

export const useManagePlans = (): ManagePlansContextType => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  
  // Get dashboard data for refund functionality
  const { handleRefund } = useDashboardData();
  
  // Use all the smaller hooks
  const { 
    plans, 
    installments, 
    activities,
    isLoading, 
    isLoadingActivities,
    fetchPaymentPlans, 
    fetchPlanInstallmentsData 
  } = usePlanDataFetcher();
  
  const { paymentData, setPaymentData, fetchPaymentDataForInstallment } = usePaymentDetailsFetcher();
  
  // Use plan details view hook
  const { 
    selectedPlan, 
    setSelectedPlan,
    showPlanDetails, 
    setShowPlanDetails,
    selectedInstallment,
    setSelectedInstallment,
    showPaymentDetails,
    setShowPaymentDetails,
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
  } = usePlanActions(() => fetchPaymentPlans(user.id));
  
  const { handleCreatePlanClick, handleViewPlansClick } = usePlanNavigation();
  
  // Use specialized action hooks
  const cancelActions = usePlanCancelActions(selectedPlan, cancelPlan, setShowPlanDetails);
  const pauseActions = usePlanPauseActions(selectedPlan, pausePlan, setShowPlanDetails);
  const resumeActions = usePlanResumeActions(selectedPlan, resumePlan, setShowPlanDetails);
  const rescheduleActions = usePlanRescheduleActions(selectedPlan, reschedulePlan, setShowPlanDetails);

  // Fetch payment plans on mount
  useEffect(() => {
    if (user) {
      fetchPaymentPlans(user.id);
    }
  }, [user]);

  const handleViewPlanDetails = async (plan: Plan) => {
    return viewPlanDetails(plan, fetchPlanInstallmentsData);
  };
  
  const handleViewPaymentDetails = async (installment: any) => {
    setSelectedInstallment(installment);
    
    const payment = await fetchPaymentDataForInstallment(installment);
    if (payment) {
      setPaymentData(payment);
      setShowPlanDetails(false); // Close the plan details dialog
      setShowPaymentDetails(true); // Open the payment details dialog
    }
  };

  // Create a wrapper for sendReminder that adapts the return type
  const handleSendReminder = async (installmentId: string): Promise<void> => {
    await sendReminder(installmentId);
    // Void return type, so no return statement needed
  };

  // Refund functionality
  const openRefundDialog = () => {
    if (paymentData && paymentData.id) {
      setPaymentToRefund(paymentData.id);
      setRefundDialogOpen(true);
    } else {
      console.error('No payment data available for refund');
    }
  };

  const processRefund = (amount?: number) => {
    if (paymentToRefund) {
      // Explicitly pass the payment ID to handleRefund
      handleRefund(amount, paymentToRefund);
      // We'll close the payment details modal after refund
      setShowPaymentDetails(false);
    } else {
      console.error('No payment ID available for refund');
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    plans,
    isLoading,
    installments,
    activities,
    isLoadingActivities,
    handleViewPlanDetails,
    handleCreatePlanClick,
    handleViewPlansClick,
    handleSendReminder,
    // Payment details properties
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    handleViewPaymentDetails,
    selectedInstallment,
    handleBackToPlans,
    // Refund properties
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    openRefundDialog,
    processRefund,
    // Cancel plan properties
    ...cancelActions,
    // Pause plan properties
    ...pauseActions,
    // Resume plan properties
    ...resumeActions,
    // Reschedule plan properties
    ...rescheduleActions,
    // Plan state helpers
    isPlanPaused,
    isProcessing
  };
};
