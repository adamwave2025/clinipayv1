
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Clinic = {
  id: string;
  clinic_name: string | null;
  email: string | null;
  stripe_account_id: string | null;
  stripe_status: string | null;
};

export const useAdminSettings = () => {
  const [platformFee, setPlatformFee] = useState('3.0');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPlatformFee();
    fetchClinics();
  }, []);

  const fetchPlatformFee = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'platform_fee_percent')
        .single();
      
      if (error) {
        console.error('Error fetching platform fee:', error);
        // If no record exists, we'll create it with a default value
        if (error.code === 'PGRST116') {
          console.log('Platform fee setting not found, using default value');
          return; // Keep using the default value set in state
        }
        throw error;
      }
      
      if (data) {
        setPlatformFee(data.value);
      }
    } catch (error) {
      console.error('Error fetching platform fee:', error);
      toast.error('Failed to load platform fee setting');
    }
  };

  const fetchClinics = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching clinics data...');
      const { data, error } = await supabase
        .from('clinics')
        .select('id, clinic_name, email, stripe_account_id, stripe_status');
      
      if (error) {
        console.error('Error fetching clinics data:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Successfully fetched ${data.length} clinics`);
        setClinics(data);
      }
    } catch (error: any) {
      console.error('Error fetching clinics:', error);
      toast.error(`Failed to load clinics: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    platformFee,
    setPlatformFee,
    clinics,
    setClinics,
    isLoading,
    fetchPlatformFee,
    fetchClinics
  };
};

// Create a new hook to get just the platform fee for use in other components
export const usePlatformFee = () => {
  const [platformFee, setPlatformFee] = useState('3.0');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    fetchPlatformFee();
  }, []);
  
  const fetchPlatformFee = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'platform_fee_percent')
        .single();
      
      if (error) {
        // If no record exists, we'll use the default value
        if (error.code === 'PGRST116') {
          console.log('Platform fee setting not found, using default value');
          return; // Keep using the default value set in state
        }
        throw error;
      }
      
      if (data) {
        setPlatformFee(data.value);
      }
    } catch (error) {
      console.error('Error fetching platform fee:', error);
      // We don't show an error toast here since this is background loading
    } finally {
      setIsLoading(false);
    }
  };
  
  return { platformFee, isLoading };
};
