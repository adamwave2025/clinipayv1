
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
    setSelectedPlan(plan);
    
    // Fetch the installments for this plan
    await fetchInstallments(plan.id);
    
    // Show the plan details dialog
    setShowPlanDetails(true);
  };
  
  const handleBackToPlans = () => {
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
