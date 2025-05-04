
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  fetchUserClinicId, 
  fetchPaymentSchedules,
  fetchPlanInstallments,
  fetchPlanActivities
} from '@/services/PaymentScheduleService';
import { 
  groupPaymentSchedulesByPlan,
  formatPlanInstallments,
  type Plan,
  type PlanInstallment
} from '@/utils/paymentPlanUtils';
import { formatPlanActivities, PlanActivity } from '@/utils/planActivityUtils';

export const usePlanDataFetcher = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [activities, setActivities] = useState<PlanActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Explicitly define the return type as Promise<Plan[]>
  const fetchPaymentPlans = async (userId: string): Promise<Plan[]> => {
    setIsLoading(true);
    try {
      // Get user's clinic_id
      const clinicId = await fetchUserClinicId(userId);
      if (!clinicId) {
        setIsLoading(false);
        return [];
      }

      // Fetch payment schedule data
      const scheduleData = await fetchPaymentSchedules(clinicId);
      
      // Process data to group by patient_id, payment_link_id, and creation batch
      const plansMap = groupPaymentSchedulesByPlan(scheduleData);
      
      const plansArray = Array.from(plansMap.values());
      setPlans(plansArray);
      return plansArray;
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
      const [patientId, paymentLinkId] = planId.split('_');
      
      if (!patientId || !paymentLinkId) {
        throw new Error('Invalid plan ID');
      }
      
      // Fetch installments for this plan
      const rawInstallments = await fetchPlanInstallments(patientId, paymentLinkId);
      
      // Format installments for display
      const formattedInstallments = formatPlanInstallments(rawInstallments);
      
      setInstallments(formattedInstallments);
      
      // Also fetch activities for this plan
      await fetchPlanActivitiesData(patientId, paymentLinkId);
      
      return formattedInstallments;
    } catch (error) {
      console.error('Error fetching plan installments:', error);
      toast.error('Failed to load payment details');
      return [];
    }
  };

  const fetchPlanActivitiesData = async (patientId: string, paymentLinkId: string) => {
    setIsLoadingActivities(true);
    try {
      // Fetch activities for this plan
      const rawActivities = await fetchPlanActivities(patientId, paymentLinkId);
      
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
