
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plan, formatPlanFromDb } from '@/utils/planTypes';
import { PlanInstallment, formatPlanInstallments, groupPaymentSchedulesByPlan } from '@/utils/paymentPlanUtils';
import { fetchPlans, fetchPlanInstallments, fetchPlanActivities } from '@/services/PaymentScheduleService';
import { formatPlanActivities } from '@/utils/planActivityUtils';
import { toast } from 'sonner';

export const usePlanDataFetcher = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Fetch payment plans from the payment_schedule table
  const fetchPaymentPlans = async (userId: string): Promise<Plan[]> => {
    setIsLoading(true);
    try {
      // First, try to fetch plans from the plans table
      const plansFromTable = await fetchPlans(userId);
      
      console.log('Plans fetched directly from plans table:', plansFromTable);
      
      if (plansFromTable.length > 0) {
        // Use plans from the plans table if available
        const formattedPlans = plansFromTable.map(plan => {
          // Make sure patientName is available in the plan object
          if (!plan.patientName && plan.patients?.name) {
            plan.patientName = plan.patients.name;
          }
          return plan;
        });
        
        setPlans(formattedPlans);
        return formattedPlans;
      }
      
      console.log('No plans found in plans table, falling back to legacy method');
      
      // Fall back to legacy method if no plans in plans table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('Error fetching user data:', userError);
        setIsLoading(false);
        return [];
      }

      const clinicId = userData.clinic_id;
      
      // Get all payment schedules for this clinic
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('payment_schedule')
        .select(`
          id, clinic_id, patient_id, payment_link_id, plan_id,
          payment_request_id, amount, payment_frequency,
          due_date, status, payment_number, total_payments,
          created_at, updated_at,
          payment_requests (
            id, status, payment_id, paid_at
          ),
          patients (
            id, name, email, phone
          ),
          payment_links (
            id, title, amount, plan_total_amount
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: true });
      
      if (scheduleError) {
        console.error('Error fetching payment schedules:', scheduleError);
        setIsLoading(false);
        return [];
      }
      
      // Use groupPaymentSchedulesByPlan to transform the data
      const planMap = groupPaymentSchedulesByPlan(scheduleData as any);
      const planList = Array.from(planMap.values()) as Plan[];
      
      // Make sure each plan has patientName set correctly
      const formattedPlans = planList.map(plan => {
        if (plan.patients && plan.patients.name) {
          plan.patientName = plan.patients.name;
        }
        return plan;
      });
      
      console.log('Plans from legacy method:', formattedPlans);
      
      setPlans(formattedPlans);
      return formattedPlans;
    } catch (error) {
      console.error('Error in fetchPaymentPlans:', error);
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
    fetchPlanInstallmentsData
  };
};
