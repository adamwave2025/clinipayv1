
import { supabase } from '@/integrations/supabase/client';
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
  stripe_account_id: string | null;
};

export const ClinicDataService = {
  async fetchClinicDataByUserId(userId: string): Promise<ClinicData | null> {
    try {
      // First get the clinic_id from the user record - using maybeSingle to avoid errors
      // when multiple or no rows are returned
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        throw new Error('Failed to fetch user data: ' + userError.message);
      }

      if (!userData?.clinic_id) {
        throw new Error('User is not associated with a clinic');
      }

      // Then get the clinic data using the clinic_id
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', userData.clinic_id)
        .single();

      if (clinicError) {
        throw new Error('Failed to fetch clinic data: ' + clinicError.message);
      }

      return clinicData;
    } catch (error: any) {
      console.error('Error fetching clinic data:', error);
      throw error;
    }
  },

  async updateClinicData(clinicId: string, updatedData: Partial<ClinicData>) {
    try {
      const { error } = await supabase
        .from('clinics')
        .update(updatedData)
        .eq('id', clinicId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating clinic data:', error);
      toast.error('Failed to update clinic data: ' + error.message);
      return { success: false, error: error.message };
    }
  }
};
