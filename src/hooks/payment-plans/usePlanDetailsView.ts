
import { useState, useEffect } from 'react';
import { Plan } from '@/utils/planTypes';

export const usePlanDetailsView = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null);
  
  // This effect fixes the timing issue with state updates
  useEffect(() => {
    if (selectedPlan && !showPlanDetails) {
      console.log('Auto-showing plan details because we have a selected plan');
      setShowPlanDetails(true);
    }
    
    if (!selectedPlan && showPlanDetails) {
      console.log('Auto-hiding plan details because we have no selected plan');
      setShowPlanDetails(false);
    }
  }, [selectedPlan, showPlanDetails]);
  
  const handleViewPlanDetails = async (
    plan: Plan, 
    fetchInstallments: (planId: string) => Promise<any[]>
  ) => {
    console.log('handleViewPlanDetails called with plan:', plan.id, plan.title || plan.planName);
    
    // Set the selected plan immediately
    setSelectedPlan(plan);
    
    // Explicitly set showPlanDetails to true
    setShowPlanDetails(true);
    
    // Fetch the installments for this plan
    if (plan && plan.id) {
      console.log('Fetching installments for plan:', plan.id);
      try {
        await fetchInstallments(plan.id);
        console.log('Installments fetched successfully');
      } catch (err) {
        console.error('Error fetching installments:', err);
      }
    }
    
    // Verify state update
    console.log('Plan details should be visible now.');
  };
  
  const handleBackToPlans = () => {
    console.log('handleBackToPlans called');
    setShowPlanDetails(false);
    setShowPaymentDetails(false);
    setSelectedInstallment(null);
    
    // Wait for the drawer to close before clearing the selected plan
    setTimeout(() => {
      setSelectedPlan(null);
    }, 300); // Match the drawer animation duration
  };
  
  // Helper to check if a plan is paused
  const isPlanPaused = (plan: Plan | null) => {
    if (!plan) return false;
    return plan.status === 'paused';
  };

  return {
    selectedPlan,
    setSelectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    showPaymentDetails,
    setShowPaymentDetails,
    selectedInstallment,
    setSelectedInstallment,
    handleViewPlanDetails,
    handleBackToPlans,
    isPlanPaused
  };
};
