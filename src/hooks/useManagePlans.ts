import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plan, PlanInstallment } from '@/utils/paymentPlanUtils';
import { usePlanDataFetcher } from './payment-plans/usePlanDataFetcher';
import { usePaymentDetailsFetcher } from './payment-plans/usePaymentDetailsFetcher';
import { usePlanActions } from './payment-plans/usePlanActions';
import { usePlanUIState } from './payment-plans/usePlanUIState';
import { usePlanNavigation } from './payment-plans/usePlanNavigation';

export const useManagePlans = () => {
  const { user } = useAuth();
  
  // Use all the smaller hooks
  const { plans, installments, isLoading, fetchPaymentPlans, fetchPlanInstallmentsData } = usePlanDataFetcher();
  const { paymentData, setPaymentData, fetchPaymentDataForInstallment } = usePaymentDetailsFetcher();
  
  // Pass fetchPaymentPlans directly as it returns Promise<Plan[]>
  const { showCancelDialog, setShowCancelDialog, handleSendReminder, handleCancelPlan, handlePausePlan } = usePlanActions(
    () => fetchPaymentPlans(user.id)
  );
  
  const { 
    searchQuery, setSearchQuery, 
    selectedPlan, setSelectedPlan,
    showPlanDetails, setShowPlanDetails,
    selectedInstallment, setSelectedInstallment,
    showPaymentDetails, setShowPaymentDetails
  } = usePlanUIState();
  const { handleCreatePlanClick, handleViewPlansClick } = usePlanNavigation();

  // Fetch payment plans on mount
  useEffect(() => {
    if (user) {
      fetchPaymentPlans(user.id);
    }
  }, [user]);

  // Filter plans when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) return;
    
    const filtered = plans.filter(plan => 
      plan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.planName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filtered.length > 0) {
      // Only update if we have results
      // This is important to prevent empty results
    }
  }, [searchQuery, plans]);

  const handleViewPlanDetails = async (plan: Plan) => {
    setSelectedPlan(plan);
    await fetchPlanInstallmentsData(plan.id);
    setShowPlanDetails(true);
  };

  const handleViewPaymentDetails = async (installment: PlanInstallment) => {
    setSelectedInstallment(installment);
    
    const payment = await fetchPaymentDataForInstallment(installment);
    if (payment) {
      setPaymentData(payment);
      setShowPlanDetails(false); // Close the plan details dialog
      setShowPaymentDetails(true); // Open the payment details dialog
    }
  };

  const handleBackToPlans = () => {
    setShowPaymentDetails(false);
    setShowPlanDetails(true);
  };

  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
  };

  const handleCancelPlanConfirm = async () => {
    if (!selectedPlan) return;
    
    const [patientId, paymentLinkId] = selectedPlan.id.split('_');
    const success = await handleCancelPlan(patientId, paymentLinkId);
    
    if (success) {
      setShowCancelDialog(false);
      setShowPlanDetails(false);
      // Refresh payment plans data
      await fetchPaymentPlans(user.id);
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
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan: handleCancelPlanConfirm,
    handleOpenCancelDialog,
    // Pause plan property
    handlePausePlan
  };
};
