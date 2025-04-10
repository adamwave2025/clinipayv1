
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
      const { data, error } = await supabase
        .from('clinics')
        .select('id, clinic_name, email, stripe_account_id, stripe_status');
      
      if (error) throw error;
      if (data) {
        setClinics(data);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      toast.error('Failed to load clinics');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    platformFee,
    clinics,
    setClinics,
    isLoading
  };
};
