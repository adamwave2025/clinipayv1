
import { supabase } from '@/integrations/supabase/client';
import { PaymentLinkData, RawClinicData } from '@/types/paymentLink';

export const PaymentLinkService = {
  formatAddress(clinicData: RawClinicData): string {
    const addressParts = [
      clinicData.address_line_1,
      clinicData.address_line_2,
      clinicData.city,
      clinicData.postcode
    ].filter(Boolean);
    
    return addressParts.join(', ');
  },

  async fetchPaymentRequest(requestId: string): Promise<PaymentLinkData | null> {
    const { data: requestData, error: requestError } = await supabase
      .from('payment_requests')
      .select(`
        id, 
        custom_amount,
        patient_name,
        patient_email,
        patient_phone,
        payment_link_id,
        clinic_id,
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
      .eq('id', requestId)
      .single();

    if (requestError || !requestData) {
      return null;
    }

    let title = 'Payment Request';
    let amount = requestData.custom_amount || 0;
    let type = 'other';
    
    // If request is linked to a payment link, try to get its details
    if (requestData.payment_link_id) {
      const { data: linkData } = await supabase
        .from('payment_links')
        .select('title, amount, type')
        .eq('id', requestData.payment_link_id)
        .single();
        
      if (linkData) {
        title = linkData.title || 'Payment Request';
        if (!requestData.custom_amount) {
          amount = linkData.amount || 0;
        }
        type = linkData.type || 'other';
      }
    }
    
    const address = this.formatAddress(requestData.clinics);

    return {
      id: requestData.id,
      title: title,
      amount: amount,
      type: type,
      isRequest: true,
      customAmount: requestData.custom_amount,
      patientName: requestData.patient_name,
      patientEmail: requestData.patient_email,
      patientPhone: requestData.patient_phone,
      clinic: {
        id: requestData.clinics.id,
        name: requestData.clinics.clinic_name || 'Clinic',
        logo: requestData.clinics.logo_url || undefined,
        email: requestData.clinics.email || undefined,
        phone: requestData.clinics.phone || undefined,
        address: address || undefined,
        stripeStatus: requestData.clinics.stripe_status || undefined
      }
    };
  },

  async fetchPaymentLink(linkId: string): Promise<PaymentLinkData | null> {
    const { data: linkData, error: linkError } = await supabase
      .from('payment_links')
      .select(`
        id, 
        title, 
        amount, 
        type, 
        description,
        clinic_id, 
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
      .single();

    if (linkError || !linkData) {
      return null;
    }

    const address = this.formatAddress(linkData.clinics);

    return {
      id: linkData.id,
      title: linkData.title || '',
      amount: linkData.amount || 0,
      type: linkData.type || 'other',
      description: linkData.description || undefined,
      isRequest: false,
      clinic: {
        id: linkData.clinics.id,
        name: linkData.clinics.clinic_name || 'Clinic',
        logo: linkData.clinics.logo_url || undefined,
        email: linkData.clinics.email || undefined,
        phone: linkData.clinics.phone || undefined,
        address: address || undefined,
        stripeStatus: linkData.clinics.stripe_status || undefined
      }
    };
  }
};
