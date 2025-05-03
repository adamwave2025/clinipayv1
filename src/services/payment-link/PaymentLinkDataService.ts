
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
    console.log('PaymentLinkDataService: Creating link with data:', {
      ...linkData,
      clinic_id: clinicId
    });
    
    // Ensure all required fields for payment plans are present
    if (linkData.paymentPlan) {
      if (!linkData.paymentCount || !linkData.paymentCycle) {
        throw new Error('Payment plan requires payment count and cycle');
      }
      
      // Calculate total amount if not provided
      if (!linkData.planTotalAmount && linkData.amount && linkData.paymentCount) {
        linkData.planTotalAmount = linkData.amount * linkData.paymentCount;
      }
    }

    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        clinic_id: clinicId,
        title: linkData.title,
        amount: linkData.amount,
        type: linkData.type,
        description: linkData.description,
        is_active: true,
        payment_plan: linkData.paymentPlan || false,
        payment_count: linkData.paymentCount,
        payment_cycle: linkData.paymentCycle,
        plan_total_amount: linkData.planTotalAmount
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment link:', error);
      throw new Error(error.message);
    }

    return data;
  },

  async fetchPaymentLinkWithClinic(linkId: string) {
    // First check if this is a payment link
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

    // If it's a payment plan, fetch additional data
    if (data && data.payment_plan) {
      // Calculate total paid from payments table
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('payment_link_id', linkId)
        .eq('status', 'paid');
      
      if (!paymentsError && paymentsData) {
        // Calculate total paid
        const totalPaid = paymentsData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
        
        // Use type assertion to add the total_paid property
        (data as any).total_paid = totalPaid;
      }
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
          description,
          payment_plan,
          payment_count,
          payment_cycle,
          plan_total_amount
        )
      `)
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    // If this is a payment plan request, fetch additional data
    if (data && data.payment_links && data.payment_links.payment_plan) {
      // Calculate total paid from payments table
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('payment_link_id', data.payment_link_id)
        .eq('status', 'paid');
      
      if (!paymentsError && paymentsData) {
        // Calculate total paid
        const totalPaid = paymentsData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
        
        // Use type assertion to add the total_paid property
        (data as any).total_paid = totalPaid;
      }
    }

    return data;
  }
};
