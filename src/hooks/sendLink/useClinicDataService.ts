
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClinicFormatter } from '@/services/payment-link/ClinicFormatter';

export function useClinicDataService() {
  const [isFetchingClinic, setIsFetchingClinic] = useState(false);

  const fetchUserClinicId = async (userId: string) => {
    setIsFetchingClinic(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('⚠️ CRITICAL ERROR: Error fetching user data:', userError);
        throw userError;
      }
      
      if (!userData.clinic_id) {
        console.error('⚠️ CRITICAL ERROR: No clinic_id found for user:', userId);
        throw new Error('No clinic associated with this user');
      }
      
      console.log('⚠️ CRITICAL: Found clinic_id:', userData.clinic_id);
      return userData.clinic_id;
    } finally {
      setIsFetchingClinic(false);
    }
  };

  const fetchClinicData = async (clinicId: string) => {
    setIsFetchingClinic(true);
    try {
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (clinicError) {
        console.error('⚠️ CRITICAL ERROR: Error fetching clinic data:', clinicError);
        throw clinicError;
      }
      
      console.log('⚠️ CRITICAL: Retrieved clinic data successfully:', clinicData.clinic_name);
      return clinicData;
    } finally {
      setIsFetchingClinic(false);
    }
  };

  const formatClinicAddress = (clinicData: any) => {
    return ClinicFormatter.formatAddress(clinicData);
  };

  return {
    isFetchingClinic,
    fetchUserClinicId,
    fetchClinicData,
    formatClinicAddress
  };
}
