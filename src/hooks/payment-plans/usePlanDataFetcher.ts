import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plan, formatPlanFromDb } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { formatPlanActivities } from '@/utils/planActivityUtils';
import { toast } from 'sonner';
import { PlanDataService } from '@/modules/payment/services/PlanDataService';

export const usePlanDataFetcher = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Fetch payment plans from the payment_schedule table
  const fetchPaymentPlans = useCallback(async (userId: string): Promise<Plan[]> => {
    console.log('Fetching payment plans for user:', userId);
    setIsLoading(true);
    try {
      // First, try to fetch plans from the plans table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', userId)
        .single();
        
      if (userError) {
        throw userError;
      }

      const clinicId = userData.clinic_id;
      
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          patients (
            id, name, email
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log('Raw plans data from DB:', data);
      
      // Format the plans using the helper function
      const formattedPlans = data.map(plan => {
        const formatted = formatPlanFromDb(plan);
        // Ensure patientName is set correctly
        if (!formatted.patientName && formatted.patients?.name) {
          formatted.patientName = formatted.patients.name;
        }
        return formatted;
      });
      
      console.log('Formatted plans:', formattedPlans);
      
      setPlans(formattedPlans);
      setIsLoading(false);
      return formattedPlans;
    } catch (error) {
      console.error('Error in fetchPaymentPlans:', error);
      setIsLoading(false);
      toast.error('Failed to load payment plans');
      return [];
    }
  }, []);

  const fetchPlanInstallmentsData = useCallback(async (planId: string): Promise<PlanInstallment[]> => {
    console.log('Fetching installments for plan:', planId);
    setInstallments([]);  // Clear previous installments to avoid stale data
    
    try {
      // Get the full plan object first
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (planError) {
        console.error('Error fetching plan data:', planError);
        toast.error('Failed to load plan details');
        return [];
      }
      
      // Format the plan object using the helper function
      const plan = formatPlanFromDb(planData);
      console.log('Fetched and formatted plan object:', plan.id, plan.title);
      
      // Use the PlanDataService to fetch installments directly
      const formattedInstallments = await PlanDataService.fetchPlanInstallments(plan);
      
      console.log('Formatted installments from PlanDataService:', 
        formattedInstallments.length, 
        formattedInstallments.map(i => ({
          id: i.id,
          status: i.status,
          paidDate: i.paidDate, 
          manualPayment: i.manualPayment
        }))
      );
      
      if (!formattedInstallments || formattedInstallments.length === 0) {
        console.warn('No installments returned for plan', planId);
        
        // Check if we have any raw data before formatting
        const { data: rawData } = await supabase
          .from('payment_schedule')
          .select('*')
          .eq('plan_id', planId);
          
        console.log('Raw payment schedule data:', rawData);
        
        if (!rawData || rawData.length === 0) {
          toast.warning('No installments found for this plan');
        } else {
          // We have raw data but formatting failed
          toast.error('Error formatting payment installments');
          console.error('Formatting issue - Raw data exists but formatted data is empty');
        }
      } else {
        console.log('Setting installments:', formattedInstallments);
        setInstallments(formattedInstallments);
      }
      
      // Also fetch activities for this plan
      await fetchPlanActivitiesData(planId);
      
      console.log('Installments fetched successfully');
      return formattedInstallments;
    } catch (error) {
      console.error('Error fetching plan installments:', error);
      toast.error('Failed to load payment details');
      return [];
    }
  }, []);

  const fetchPlanActivitiesData = useCallback(async (planId: string) => {
    console.log('Fetching activities for plan:', planId);
    setIsLoadingActivities(true);
    try {
      // Get the full plan object first
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (planError) {
        console.error('Error fetching plan data:', planError);
        setIsLoadingActivities(false);
        return [];
      }
      
      // Format the plan object
      const plan = formatPlanFromDb(planData);
      
      // Fetch activities for this plan using PlanDataService
      const formattedActivities = await PlanDataService.fetchPlanActivities(plan);
      
      console.log('Formatted activities:', formattedActivities.length);
      
      setActivities(formattedActivities);
      setIsLoadingActivities(false);
      return formattedActivities;
    } catch (error) {
      console.error('Error fetching plan activities:', error);
      setIsLoadingActivities(false);
      return [];
    }
  }, []);

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
