
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/utils/planTypes';
import { toast } from 'sonner'; 
import { usePlanDataFetcher } from './payment-plans/usePlanDataFetcher';

export const useManagePlans = () => {
  const { user } = useAuth();
  const { fetchPaymentPlans } = usePlanDataFetcher();
  
  const refreshData = async (userId?: string) => {
    try {
      const targetUserId = userId || (user?.id || '');
      console.log('Refreshing payment plans data with userId:', targetUserId);
      
      if (!targetUserId) {
        console.warn('No user ID available for refreshing payment plans');
        return [];
      }
      
      const fetchedPlans = await fetchPaymentPlans(targetUserId);
      console.log(`Successfully fetched ${fetchedPlans.length} plans for userId: ${targetUserId}`);

      return fetchedPlans;
    } catch (error) {
      console.error('Error refreshing payment plans:', error);
      toast.error('Failed to refresh payment plans');
      return [];
    }
  };

  return { refreshData };
};
