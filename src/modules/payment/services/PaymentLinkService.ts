
import { supabase } from '@/integrations/supabase/client';

export const PaymentLinkService = {
  /**
   * Fetches both active and archived links for a clinic
   */
  fetchLinks: async (clinicId: string) => {
    try {
      // Get active links
      const { data: activeLinks, error: activeError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);
        
      if (activeError) {
        throw activeError;
      }
      
      // Get archived links
      const { data: archivedLinks, error: archivedError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', false);
        
      if (archivedError) {
        throw archivedError;
      }
      
      return { activeLinks, archivedLinks };
    } catch (error) {
      console.error('Error fetching payment links:', error);
      return { activeLinks: [], archivedLinks: [], error };
    }
  },
  
  /**
   * Archives a payment link
   */
  archiveLink: async (linkId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .update({ is_active: false })
        .eq('id', linkId);
        
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error archiving payment link:', error);
      return { success: false, error: (error as Error).message };
    }
  },
  
  /**
   * Unarchives a payment link
   */
  unarchiveLink: async (linkId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .update({ is_active: true })
        .eq('id', linkId);
        
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unarchiving payment link:', error);
      return { success: false, error: (error as Error).message };
    }
  }
};
