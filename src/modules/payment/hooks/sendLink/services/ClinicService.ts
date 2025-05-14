
import { supabase } from '@/integrations/supabase/client';
import { ClinicFormatter } from '@/services/payment-link/ClinicFormatter';

export const ClinicService = {
  /**
   * Fetch clinic data by ID
   */
  async fetchClinicData(clinicId: string) {
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();

    if (clinicError) {
      console.error('⚠️ CRITICAL ERROR: Error fetching clinic data:', clinicError);
      throw new Error('Could not find clinic information');
    }

    return clinicData;
  },

  /**
   * Format clinic address from clinic data
   */
  formatClinicAddress(clinicData: any) {
    return ClinicFormatter.formatAddress(clinicData);
  }
};
