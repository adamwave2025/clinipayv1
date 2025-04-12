
import { supabase } from '@/integrations/supabase/client';
import { PaymentLink } from '@/types/payment';
import { PaymentLinkData, RawClinicData } from '@/types/paymentLink';
import { toast } from 'sonner';

export const PaymentLinkService = {
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
  },

  // Adding the missing methods
  async fetchPaymentRequest(requestId: string): Promise<PaymentLinkData | null> {
    try {
      // Fetch payment request with clinic data
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
        console.error('Error fetching payment request:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Format clinic data from the request
      const clinicData = data.clinics as RawClinicData;

      // If it's a custom amount request
      if (data.custom_amount && !data.payment_link_id) {
        return {
          id: data.id,
          title: `Payment for ${data.patient_name}`,
          amount: data.custom_amount,
          type: 'custom',
          description: data.message || undefined,
          isRequest: true,
          customAmount: data.custom_amount,
          patientName: data.patient_name,
          patientEmail: data.patient_email,
          patientPhone: data.patient_phone,
          clinic: {
            id: clinicData.id,
            name: clinicData.clinic_name || 'Unknown Clinic',
            logo: clinicData.logo_url || undefined,
            email: clinicData.email || undefined,
            phone: clinicData.phone || undefined,
            address: this.formatAddress(clinicData),
            stripeStatus: clinicData.stripe_status || undefined
          }
        };
      }

      // If it's a payment link-based request
      if (data.payment_links) {
        const linkData = data.payment_links;
        return {
          id: data.id,
          title: linkData.title || `Payment for ${data.patient_name}`,
          amount: linkData.amount,
          type: linkData.type || 'other',
          description: linkData.description || data.message,
          isRequest: true,
          patientName: data.patient_name,
          patientEmail: data.patient_email,
          patientPhone: data.patient_phone,
          clinic: {
            id: clinicData.id,
            name: clinicData.clinic_name || 'Unknown Clinic',
            logo: clinicData.logo_url || undefined,
            email: clinicData.email || undefined,
            phone: clinicData.phone || undefined,
            address: this.formatAddress(clinicData),
            stripeStatus: clinicData.stripe_status || undefined
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching payment request:', error);
      return null;
    }
  },

  async fetchPaymentLink(linkId: string): Promise<PaymentLinkData | null> {
    try {
      // Fetch payment link with clinic data
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
        console.error('Error fetching payment link:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Format clinic data from the link
      const clinicData = data.clinics as RawClinicData;

      return {
        id: data.id,
        title: data.title || 'Payment',
        amount: data.amount,
        type: data.type || 'other',
        description: data.description,
        clinic: {
          id: clinicData.id,
          name: clinicData.clinic_name || 'Unknown Clinic',
          logo: clinicData.logo_url || undefined,
          email: clinicData.email || undefined,
          phone: clinicData.phone || undefined,
          address: this.formatAddress(clinicData),
          stripeStatus: clinicData.stripe_status || undefined
        }
      };
    } catch (error) {
      console.error('Error fetching payment link:', error);
      return null;
    }
  },

  // Helper function to format address
  formatAddress(clinic: RawClinicData): string | undefined {
    const addressParts = [
      clinic.address_line_1,
      clinic.address_line_2,
      clinic.city,
      clinic.postcode
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : undefined;
  }
};
