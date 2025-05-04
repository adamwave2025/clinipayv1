
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

export const usePlanUIState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
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
