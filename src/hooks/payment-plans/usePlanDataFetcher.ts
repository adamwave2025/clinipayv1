
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  fetchUserClinicId, 
  fetchPaymentSchedules,
  fetchPlanInstallments,
  fetchPlanActivities,
  fetchPlansForClinic
} from '@/services/PaymentScheduleService';
import { 
  formatPlanInstallments,
  PlanInstallment
} from '@/utils/paymentPlanUtils';
import { formatPlanActivities, PlanActivity } from '@/utils/planActivityUtils';
import { Plan, formatPlanFromDb } from '@/utils/planTypes';

export const usePlanDataFetcher = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [activities, setActivities] = useState<PlanActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Now fetch plans directly from the plans table
  const fetchPaymentPlans = async (userId: string): Promise<Plan[]> => {
    setIsLoading(true);
    try {
      // Get user's clinic_id
      const clinicId = await fetchUserClinicId(userId);
      if (!clinicId) {
        setIsLoading(false);
        return [];
      }

      // Fetch plans from the new plans table
      const plansData = await fetchPlansForClinic(clinicId);
      
      // Format the plans for the frontend
      const formattedPlans = plansData.map(plan => formatPlanFromDb(plan));
      
      setPlans(formattedPlans);
      return formattedPlans;
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast.error('Failed to load payment plans');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPlanInstallmentsData = async (planId: string) => {
    try {
      // Fetch installments directly using the plan_id from payment_schedule
      const rawInstallments = await fetchPlanInstallments(planId);
      
      // Format installments for display
      const formattedInstallments = formatPlanInstallments(rawInstallments);
      
      setInstallments(formattedInstallments);
      
      // Also fetch activities for this plan
      await fetchPlanActivitiesData(planId);
      
      return formattedInstallments;
    } catch (error) {
      console.error('Error fetching plan installments:', error);
      toast.error('Failed to load payment details');
      return [];
    }
  };

  const fetchPlanActivitiesData = async (planId: string) => {
    setIsLoadingActivities(true);
    try {
      // Fetch activities for this plan
      const rawActivities = await fetchPlanActivities(planId);
      
      // Format activities for display
      const formattedActivities = formatPlanActivities(rawActivities);
      
      setActivities(formattedActivities);
      return formattedActivities;
    } catch (error) {
      console.error('Error fetching plan activities:', error);
      return [];
    } finally {
      setIsLoadingActivities(false);
    }
  };

  return {
    plans,
    installments,
    activities,
    isLoading,
    isLoadingActivities,
    fetchPaymentPlans,
    fetchPlanInstallmentsData,
    fetchPlanActivitiesData
  };
};
