
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/utils/planTypes';
import { usePlanDataFetcher } from './usePlanDataFetcher';

/**
 * Core hook providing basic plan management functionality
 */
export const usePlanCore = () => {
  const { user } = useAuth();
  
  // Get plan data using the data fetcher
  const { 
    plans: allPlans, 
    installments, 
    activities,
    isLoading, 
    isLoadingActivities,
    fetchPaymentPlans, 
    fetchPlanInstallmentsData 
  } = usePlanDataFetcher();
  
  // Add the hasPaidPayments state explicitly
  const [hasPaidPayments, setHasPaidPayments] = useState(false);
  
  // Add a flag to track if there are overdue payments
  const [hasOverduePayments, setHasOverduePayments] = useState(false);

  // Create a refresh function for use after operations
  const refreshData = async () => {
    if (user) {
      await fetchPaymentPlans(user.id);
    }
  };

  // Update the hasPaidPayments and hasOverduePayments state when installments change
  useEffect(() => {
    if (installments.length > 0) {
      // Count installments with paid, refunded or partially_refunded status as "paid"
      const hasPaid = installments.some(installment => 
        ['paid', 'refunded', 'partially_refunded'].includes(installment.status)
      );
      setHasPaidPayments(hasPaid);
      
      const hasOverdue = installments.some(installment => {
        if (installment.status === 'overdue') return true;
        if (installment.status === 'paid' || installment.status === 'cancelled' || 
            installment.status === 'paused' || installment.status === 'refunded' || 
            installment.status === 'partially_refunded') {
          return false;
        }
        const now = new Date();
        const dueDate = new Date(installment.dueDate);
        return dueDate < now;
      });
      setHasOverduePayments(hasOverdue);
    }
  }, [installments]);

  // Fetch payment plans on mount
  useEffect(() => {
    if (user) {
      console.log('Fetching payment plans for user:', user.id);
      fetchPaymentPlans(user.id);
    }
  }, [user, fetchPaymentPlans]);
  
  return {
    allPlans,
    installments,
    activities,
    isLoading,
    isLoadingActivities,
    fetchPaymentPlans,
    fetchPlanInstallmentsData,
    hasOverduePayments,
    hasPaidPayments,
    refreshData,
    user
  };
};
