
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';

export const usePlanDetailsView = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null);
  
  const handleViewPlanDetails = async (
    plan: Plan, 
    fetchInstallments: (planId: string) => Promise<any[]>
  ) => {
    console.log('handleViewPlanDetails called with plan:', plan.id, plan.title || plan.planName);
    
    // Set the selected plan immediately
    setSelectedPlan(plan);
    
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
    
    // Explicitly log when we're setting showPlanDetails to true
    console.log('Setting showPlanDetails to true');
    setShowPlanDetails(true);
    
    // Verify that state was set correctly after a short delay
    setTimeout(() => {
      console.log('State check - selectedPlan:', selectedPlan?.id);
      console.log('State check - showPlanDetails:', showPlanDetails);
    }, 100);
  };
  
  const handleBackToPlans = () => {
    console.log('handleBackToPlans called');
    setShowPlanDetails(false);
    setShowPaymentDetails(false);
    setSelectedPlan(null);
    setSelectedInstallment(null);
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
