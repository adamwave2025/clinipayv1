
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clinic } from '@/types/admin';

export const useClinicsList = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

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
    clinics,
    setClinics,
    isLoading,
    fetchClinics
  };
};
