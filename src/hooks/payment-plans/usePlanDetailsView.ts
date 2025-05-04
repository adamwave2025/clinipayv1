
import { useState } from 'react';
import { Plan, PlanInstallment } from '@/utils/paymentPlanUtils';

export interface PaymentDetailData {
  id: string;
  amount: number;
  status: string;
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
}

export const usePlanDetailsView = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  
  const isPlanPaused = (plan: Plan | null): boolean => {
    return plan?.status === 'paused';
  };

  const handleViewPlanDetails = async (
    plan: Plan, 
    fetchInstallments: (planId: string) => Promise<PlanInstallment[]>
  ) => {
    setSelectedPlan(plan);
    await fetchInstallments(plan.id);
    setShowPlanDetails(true);
  };

  const handleBackToPlans = () => {
    setShowPaymentDetails(false);
    setShowPlanDetails(true);
  };

  return {
    selectedPlan,
    setSelectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    selectedInstallment,
    setSelectedInstallment,
    showPaymentDetails,
    setShowPaymentDetails,
    isPlanPaused,
    handleViewPlanDetails,
    handleBackToPlans
  };
};
