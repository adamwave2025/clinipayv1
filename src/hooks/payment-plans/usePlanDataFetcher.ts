
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  fetchUserClinicId, 
  fetchPaymentSchedules,
  fetchPlanInstallments
} from '@/services/PaymentScheduleService';
import { 
  groupPaymentSchedulesByPlan,
  formatPlanInstallments,
  type Plan,
  type PlanInstallment
} from '@/utils/paymentPlanUtils';

export const usePlanDataFetcher = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentPlans = async (userId: string) => {
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
      
      // Process data to group by patient_id and payment_link_id
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
      return formattedInstallments;
    } catch (error) {
      console.error('Error fetching plan installments:', error);
      toast.error('Failed to load payment details');
      return [];
    }
  };

  return {
    plans,
    installments,
    isLoading,
    fetchPaymentPlans,
    fetchPlanInstallmentsData
  };
};
