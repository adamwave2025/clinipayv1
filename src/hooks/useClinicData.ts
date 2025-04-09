
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ClinicData = {
  id: string;
  clinic_name: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  logo_url: string | null;
};

export function useClinicData() {
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClinicData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, get the user's clinic ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        throw new Error('Failed to fetch user data: ' + userError.message);
      }

      if (!userData.clinic_id) {
        throw new Error('User is not associated with a clinic');
      }

      // Now fetch the clinic data using the clinic_id
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', userData.clinic_id)
        .single();

      if (clinicError) {
        throw new Error('Failed to fetch clinic data: ' + clinicError.message);
      }

      setClinicData(clinicData);
    } catch (error: any) {
      console.error('Error fetching clinic data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateClinicData = async (updatedData: Partial<ClinicData>) => {
    if (!clinicData) {
      toast.error('No clinic data to update');
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('clinics')
        .update(updatedData)
        .eq('id', clinicData.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setClinicData({
        ...clinicData,
        ...updatedData,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating clinic data:', error);
      toast.error('Failed to update clinic data: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchClinicData();
  }, [user]);

  return {
    clinicData,
    isLoading,
    error,
    fetchClinicData,
    updateClinicData,
  };
}
