import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';

export const PaymentLinkService = {
  async fetchLinks(clinicId: string) {
    try {
      // Fetch active payment links (is_active = true)
      const { data: activeLinksData, error: activeLinksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);
      
      // Fetch archived payment links (is_active = false)
      const { data: archivedLinksData, error: archivedLinksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', false);

      if (activeLinksError) {
        throw activeLinksError;
      }

      if (archivedLinksError) {
        throw archivedLinksError;
      }

      // Return both active and archived links
      return {
        activeLinks: activeLinksData || [],
        archivedLinks: archivedLinksData || []
      };
    } catch (error) {
      console.error('Error fetching payment links:', error);
      return { activeLinks: [], archivedLinks: [] };
    }
  },

  async archiveLink(linkId: string) {
    try {
      const { error } = await supabase
        .from('payment_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error archiving payment link:', error);
      return { success: false, error };
    }
  },

  async unarchiveLink(linkId: string) {
    try {
      const { error } = await supabase
        .from('payment_links')
        .update({ is_active: true })
        .eq('id', linkId);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error unarchiving payment link:', error);
      return { success: false, error };
    }
  },

  async createLink(linkData: any) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .insert([linkData])
        .select()

      if (error) {
        throw error;
      }
  
      return { data, error: null };
    } catch (error: any) {
      console.error("Error creating payment link:", error.message);
      toast.error("Failed to create payment link.");
      return { data: null, error: error.message };
    }
  },

  async updateLink(linkId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .update(updates)
        .eq('id', linkId)
        .select();
  
      if (error) {
        throw error;
      }
  
      return { data, error: null };
    } catch (error: any) {
      console.error("Error updating payment link:", error.message);
      toast.error("Failed to update payment link.");
      return { data: null, error: error.message };
    }
  },
};
