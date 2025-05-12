
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/utils/planTypes';
import { toast } from 'sonner'; 
import { usePlanDataFetcher } from './payment-plans/usePlanDataFetcher';

export const useManagePlans = () => {
  const { user } = useAuth();
  const { fetchPaymentPlans } = usePlanDataFetcher();
  
  // Fix just the refreshData call in useManagePlans.ts
  const refreshData = async (userId?: string) => {
    try {
      console.log('Refreshing payment plans data with userId:', userId || (user?.id || ''));
      const fetchedPlans = await fetchPaymentPlans(userId || (user?.id || ''));

      return fetchedPlans;
    } catch (error) {
      console.error('Error refreshing payment plans:', error);
      toast.error('Failed to refresh payment plans');
      return [];
    }
  };

  return { refreshData };
};
