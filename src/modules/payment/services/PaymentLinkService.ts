
import { supabase } from '@/integrations/supabase/client';

export class PaymentLinkService {
  static async getActiveLinks(clinicId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active payment links:', error);
      throw error;
    }
  }

  static async getArchivedLinks(clinicId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching archived payment links:', error);
      throw error;
    }
  }

  static async archiveLink(linkId: string) {
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
  }

  static async unarchiveLink(linkId: string) {
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

  static async createPaymentLink(linkData: any) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .insert(linkData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating payment link:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}
