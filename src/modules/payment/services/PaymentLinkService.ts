
import { supabase } from '@/integrations/supabase/client';
import { PaymentLink } from '../types/paymentLink';

export const PaymentLinkService = {
  /**
   * Fetches both active and archived links for a clinic
   */
  fetchLinks: async (clinicId: string): Promise<{ activeLinks: PaymentLink[], archivedLinks: PaymentLink[], error?: any }> => {
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
      
      return { activeLinks: activeLinks || [], archivedLinks: archivedLinks || [] };
    } catch (error) {
      console.error('Error fetching payment links:', error);
      return { activeLinks: [], archivedLinks: [], error };
    }
  },
  
  /**
   * Archives a payment link
   */
  archiveLink: async (linkId: string): Promise<{ success: boolean, error?: any }> => {
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
  unarchiveLink: async (linkId: string): Promise<{ success: boolean, error?: any }> => {
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
  },

  /**
   * Creates a new payment link
   */
  createLink: async (linkData: Partial<PaymentLink>): Promise<{ success: boolean, paymentLink?: PaymentLink, error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .insert(linkData)
        .select()
        .single();

      if (error) throw error;
      
      return { 
        success: true, 
        paymentLink: data as PaymentLink 
      };
    } catch (error) {
      console.error('Error creating payment link:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error creating payment link' 
      };
    }
  },

  /**
   * Updates an existing payment link
   */
  updateLink: async (linkId: string, linkData: Partial<PaymentLink>): Promise<{ success: boolean, paymentLink?: PaymentLink, error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .update(linkData)
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;
      
      return { 
        success: true, 
        paymentLink: data as PaymentLink 
      };
    } catch (error) {
      console.error('Error updating payment link:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error updating payment link' 
      };
    }
  }
};
