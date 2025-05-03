
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/utils/paymentPlanUtils';
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

export const useManagePlans = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use all the smaller hooks
  const { plans, installments, isLoading, fetchPaymentPlans, fetchPlanInstallmentsData } = usePlanDataFetcher();
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
    handleSendReminder, 
    handleCancelPlan, 
    handlePausePlan,
    handleResumePlan,
    handleReschedulePlan
  } = usePlanActions(() => fetchPaymentPlans(user.id));
  
  const { handleCreatePlanClick, handleViewPlansClick } = usePlanNavigation();
  
  // Use specialized action hooks
  const cancelActions = usePlanCancelActions(selectedPlan, handleCancelPlan, setShowPlanDetails);
  const pauseActions = usePlanPauseActions(selectedPlan, handlePausePlan, setShowPlanDetails);
  const resumeActions = usePlanResumeActions(selectedPlan, handleResumePlan, setShowPlanDetails);
  const rescheduleActions = usePlanRescheduleActions(selectedPlan, handleReschedulePlan, setShowPlanDetails);

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

  return {
    searchQuery,
    setSearchQuery,
    selectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    plans,
    isLoading,
    installments,
    handleViewPlanDetails,
    handleCreatePlanClick,
    handleViewPlansClick,
    handleSendReminder,
    // Payment details properties
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    handleViewPaymentDetails,
    handleBackToPlans,
    // Cancel plan properties
    ...cancelActions,
    // Pause plan properties
    ...pauseActions,
    // Resume plan properties
    ...resumeActions,
    // Reschedule plan properties
    ...rescheduleActions,
    isPlanPaused,
    isProcessing
  };
};
