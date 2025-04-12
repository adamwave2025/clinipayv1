
import { supabase } from '@/integrations/supabase/client';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';

export const PaymentLinkApi = {
  async fetchLinks(userId: string) {
    try {
      // Get the clinic_id for the current user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!userData.clinic_id) {
        throw new Error('No clinic associated with this user');
      }

      // Fetch active payment links for this clinic
      const { data: activeData, error: activeLinksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', userData.clinic_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (activeLinksError) {
        throw new Error(activeLinksError.message);
      }

      // Fetch archived payment links for this clinic
      const { data: archivedData, error: archivedLinksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', userData.clinic_id)
        .eq('is_active', false)
        .order('created_at', { ascending: false });

      if (archivedLinksError) {
        throw new Error(archivedLinksError.message);
      }

      return { 
        activeLinks: activeData || [], 
        archivedLinks: archivedData || [],
        clinicId: userData.clinic_id
      };
    } catch (error: any) {
      console.error('Error fetching payment links:', error);
      throw error;
    }
  },

  async toggleArchiveStatus(linkId: string, archive: boolean) {
    try {
      const { error: updateError } = await supabase
        .from('payment_links')
        .update({ is_active: !archive })
        .eq('id', linkId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error(`Error ${archive ? 'archiving' : 'unarchiving'} payment link:`, error);
      return { success: false, error: error.message };
    }
  },

  async createPaymentLink(linkData: Partial<PaymentLink>, clinicId: string) {
    try {
      // Create the payment link in the database
      const { data, error: insertError } = await supabase
        .from('payment_links')
        .insert({
          clinic_id: clinicId,
          title: linkData.title,
          amount: linkData.amount,
          type: linkData.type,
          description: linkData.description,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return { 
        success: true, 
        data
      };
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      return { success: false, error: error.message };
    }
  }
};
