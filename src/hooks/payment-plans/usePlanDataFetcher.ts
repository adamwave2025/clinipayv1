
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plan, formatPlanFromDb } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { formatPlanActivities } from '@/utils/planActivityUtils';
import { toast } from 'sonner';
import { PlanDataService } from '@/modules/payment/services/PlanDataService';

// Cache management constants
const PLANS_CACHE_KEY = 'plans_cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const usePlanDataFetcher = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  // Track fetch attempts to implement exponential backoff
  const fetchAttemptsRef = useRef(0);
  const lastFetchTimeRef = useRef(0);
  
  // Get cache for plans
  const getPlansFromCache = useCallback((userId: string): { data: Plan[] | null, timestamp: number } => {
    try {
      const cacheKey = `${PLANS_CACHE_KEY}${userId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        return { data, timestamp };
      }
    } catch (error) {
      console.warn('Error reading plans from cache:', error);
    }
    
    return { data: null, timestamp: 0 };
  }, []);
  
  // Save plans to cache
  const savePlansToCache = useCallback((userId: string, data: Plan[]) => {
    try {
      const cacheKey = `${PLANS_CACHE_KEY}${userId}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('Saved plans to cache');
    } catch (error) {
      console.warn('Error saving plans to cache:', error);
    }
  }, []);
  
  // Determine if we should use cache or fetch new data
  const shouldFetchFresh = useCallback((userId: string): boolean => {
    try {
      const { timestamp } = getPlansFromCache(userId);
      
      // Use cache if it's recent enough
      if (timestamp && Date.now() - timestamp < CACHE_EXPIRY) {
        console.log('Cache is fresh, using cached plans');
        return false;
      }
      
      // Prevent fetching too frequently
      const now = Date.now();
      const minTimeBetweenFetches = Math.min(1000 * Math.pow(2, fetchAttemptsRef.current), 10000); // Exponential backoff up to 10s
      
      if (fetchAttemptsRef.current > 0 && now - lastFetchTimeRef.current < minTimeBetweenFetches) {
        console.log(`Too soon to fetch again (${now - lastFetchTimeRef.current}ms since last fetch), using cache`);
        return false;
      }
    } catch (error) {
      console.warn('Error checking cache freshness:', error);
    }
    
    // Default to fetching fresh data
    return true;
  }, [getPlansFromCache]);

  // Fetch payment plans from the payment_schedule table
  const fetchPaymentPlans = useCallback(async (userId: string): Promise<Plan[]> => {
    console.log('Fetching payment plans for user:', userId);
    setIsLoading(true);
    
    // Check if we have recent cached data
    const { data: cachedPlans } = getPlansFromCache(userId);
    if (cachedPlans && !shouldFetchFresh(userId)) {
      console.log('Using cached plans data:', cachedPlans.length);
      setPlans(cachedPlans);
      setIsLoading(false);
      return cachedPlans;
    }
    
    // Track fetch attempt
    lastFetchTimeRef.current = Date.now();
    fetchAttemptsRef.current += 1;
    
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
            id, name, email, phone
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
      
      // Save to cache
      savePlansToCache(userId, formattedPlans);
      
      // Reset fetch attempts counter on success
      fetchAttemptsRef.current = 0;
      
      setPlans(formattedPlans);
      setIsLoading(false);
      return formattedPlans;
    } catch (error) {
      console.error('Error in fetchPaymentPlans:', error);
      
      // If we have cached data, use it as fallback
      if (cachedPlans) {
        console.log('Using cached plans as fallback after fetch error');
        setPlans(cachedPlans);
        toast.error('Using cached plan data - please check your connection');
      } else {
        toast.error('Failed to load payment plans');
      }
      
      setIsLoading(false);
      return cachedPlans || [];
    }
  }, [getPlansFromCache, shouldFetchFresh, savePlansToCache]);

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
          manualPayment: i.manualPayment || false // Add default false if undefined
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
