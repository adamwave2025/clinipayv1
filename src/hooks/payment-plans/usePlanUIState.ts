
import { useState } from 'react';
import { Plan, PlanInstallment } from '@/utils/paymentPlanUtils';

export const usePlanUIState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  return {
    searchQuery,
    setSearchQuery,
    selectedPlan,
    setSelectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    selectedInstallment,
    setSelectedInstallment,
    showPaymentDetails,
    setShowPaymentDetails
  };
};
