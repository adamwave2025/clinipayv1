
import { supabase } from '@/integrations/supabase/client';
import { PaymentLink } from '@/types/payment';
import { RawClinicData } from '@/types/paymentLink';

export const PaymentLinkDataService = {
  async fetchUserClinicId(userId: string) {
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

    return userData.clinic_id;
  },

  async fetchActiveLinks(clinicId: string) {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async fetchArchivedLinks(clinicId: string) {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async toggleLinkArchiveStatus(linkId: string, isActive: boolean) {
    const { error } = await supabase
      .from('payment_links')
      .update({ is_active: isActive })
      .eq('id', linkId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  },

  async createLink(linkData: Partial<PaymentLink>, clinicId: string) {
    const { data, error } = await supabase
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

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async fetchPaymentRequestWithClinic(requestId: string) {
    const { data, error } = await supabase
      .from('payment_requests')
      .select(`
        *,
        clinics:clinic_id (
          id,
          clinic_name,
          logo_url,
          email,
          phone,
          address_line_1,
          address_line_2,
          city,
          postcode,
          stripe_status
        ),
        payment_links:payment_link_id (
          title,
          amount,
          type,
          description
        )
      `)
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async fetchPaymentLinkWithClinic(linkId: string) {
    const { data, error } = await supabase
      .from('payment_links')
      .select(`
        *,
        clinics:clinic_id (
          id,
          clinic_name,
          logo_url,
          email,
          phone,
          address_line_1,
          address_line_2,
          city,
          postcode,
          stripe_status
        )
      `)
      .eq('id', linkId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
};
