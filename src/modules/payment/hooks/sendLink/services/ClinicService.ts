
import { supabase } from '@/integrations/supabase/client';

export const ClinicService = {
  /**
   * Fetch user's clinic ID
   */
  async fetchUserClinicId(userId: string): Promise<string> {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('⚠️ CRITICAL ERROR: Error fetching user clinic ID:', userError);
        throw new Error('Could not find your clinic. Please try again.');
      }
      
      if (!userData.clinic_id) {
        console.error('⚠️ CRITICAL ERROR: User has no associated clinic ID');
        throw new Error('No clinic associated with your account. Please contact support.');
      }
      
      return userData.clinic_id;
    } catch (error) {
      console.error('⚠️ CRITICAL ERROR: Error in fetchUserClinicId:', error);
      throw error;
    }
  },
  
  /**
   * Fetch clinic data
   */
  async fetchClinicData(clinicId: string): Promise<any> {
    try {
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
        
      if (clinicError) {
        console.error('⚠️ CRITICAL ERROR: Error fetching clinic data:', clinicError);
        throw new Error('Could not fetch clinic data. Please try again.');
      }
      
      return clinicData;
    } catch (error) {
      console.error('⚠️ CRITICAL ERROR: Error in fetchClinicData:', error);
      throw error;
    }
  },
  
  /**
   * Format clinic address from clinic data
   */
  formatClinicAddress(clinicData: any): string {
    if (!clinicData) return '';
    
    const addressParts = [];
    
    if (clinicData.address_line_1) addressParts.push(clinicData.address_line_1);
    if (clinicData.address_line_2) addressParts.push(clinicData.address_line_2);
    if (clinicData.city) addressParts.push(clinicData.city);
    if (clinicData.postcode) addressParts.push(clinicData.postcode);
    if (clinicData.country) addressParts.push(clinicData.country);
    
    return addressParts.join(', ');
  }
};
