import { supabase } from '@/integrations/supabase/client';
import { PaymentLinkData } from '@/types/paymentLink';

export const PaymentLinkService = {
  async fetchPaymentLink(linkId: string): Promise<PaymentLinkData | null> {
    try {
      // Fetch payment link data
      const { data: linkData, error: linkError } = await supabase
        .from('payment_links')
        .select(`
          id, 
          title, 
          type, 
          amount, 
          description, 
          payment_plan,
          plan_total_amount,
          clinics (
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
        console.error('Error fetching payment link:', linkError);
        return null;
      }

      // If it's a payment plan, fetch the plan data from the plans table
      let planData = null;
      let paymentPlanDetails = null;
      let status = 'active';

      if (linkData.payment_plan) {
        // Fetch plan data from the plans table to get accurate status
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('status, has_overdue_payments, total_amount, next_due_date')
          .eq('payment_link_id', linkId)
          .maybeSingle();

        if (!planError && plan) {
          status = plan.status; // Get status from plans table
          paymentPlanDetails = plan;
        }
        
        // Also get payment information for this plan to show payment progress
        const { data: schedules, error: schedulesError } = await supabase
          .from('payment_schedule')
          .select(`
            amount,
            payment_number,
            total_payments,
            status,
            payment_request_id,
            payment_requests (
              payment_id,
              status
            )
          `)
          .eq('payment_link_id', linkId)
          .order('payment_number', { ascending: true });
          
        if (!schedulesError && schedules) {
          // Calculate total paid and outstanding
          const totalAmount = paymentPlanDetails?.total_amount || linkData.plan_total_amount || 0;
          let totalPaid = 0;
          
          schedules.forEach(schedule => {
            if (
              schedule.payment_request_id && 
              schedule.payment_requests?.payment_id
            ) {
              totalPaid += schedule.amount || 0;
            }
          });
          
          const totalOutstanding = totalAmount - totalPaid;
          
          planData = {
            schedules,
            totalAmount,
            totalPaid,
            totalOutstanding
          };
        }
      }
      
      // Format the combined data
      const clinic = {
        id: linkData.clinics.id,
        name: linkData.clinics.clinic_name,
        logo: linkData.clinics.logo_url,
        email: linkData.clinics.email,
        phone: linkData.clinics.phone,
        address: [
          linkData.clinics.address_line_1,
          linkData.clinics.address_line_2,
          linkData.clinics.city,
          linkData.clinics.postcode
        ].filter(Boolean).join(', '),
        stripeStatus: linkData.clinics.stripe_status
      };

      return {
        id: linkData.id,
        title: linkData.title,
        type: linkData.type,
        amount: linkData.amount / 100, // Convert from cents
        description: linkData.description,
        clinic,
        status, // Use the status from the plan if it's a payment plan
        paymentPlan: linkData.payment_plan,
        planTotalAmount: planData?.totalAmount ? planData.totalAmount / 100 : null,
        totalPaid: planData?.totalPaid ? planData.totalPaid / 100 : null,
        totalOutstanding: planData?.totalOutstanding ? planData.totalOutstanding / 100 : null,
        isRequest: false,
        hasOverduePayments: paymentPlanDetails?.has_overdue_payments || false
      };
    } catch (error) {
      console.error('Exception in fetchPaymentLink:', error);
      return null;
    }
  },

  async fetchPaymentRequest(requestId: string): Promise<PaymentLinkData | null> {
    try {
      // Fetch payment request data
      const { data: requestData, error: requestError } = await supabase
        .from('payment_requests')
        .select(`
          id,
          custom_amount,
          patient_name,
          patient_email,
          patient_phone,
          status,
          payment_id,
          payment_link_id,
          clinic_id,
          payment_links (
            id,
            title,
            type,
            amount,
            description,
            payment_plan,
            plan_total_amount
          ),
          clinics (
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
        console.error('Error fetching payment request:', requestError);
        return null;
      }
      
      // If this is a payment plan request, get plan status from the plans table
      let planData = null;
      let status = requestData.status || 'pending';
      let paymentPlanDetails = null;
      
      // Check if this is linked to a payment plan
      if (requestData.payment_links?.payment_plan) {
        // Get the plan data for accurate status
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('status, has_overdue_payments, total_amount, next_due_date')
          .eq('payment_link_id', requestData.payment_link_id)
          .maybeSingle();
          
        if (!planError && plan) {
          status = plan.status; // Use the status from the plans table
          paymentPlanDetails = plan;
        }
        
        // Also get payment information for this plan to show payment progress
        const { data: schedules, error: schedulesError } = await supabase
          .from('payment_schedule')
          .select(`
            amount,
            payment_number,
            total_payments,
            status,
            payment_request_id,
            payment_requests (
              payment_id,
              status
            )
          `)
          .eq('payment_link_id', requestData.payment_link_id)
          .order('payment_number', { ascending: true });
          
        if (!schedulesError && schedules) {
          // Calculate total paid and outstanding 
          const totalAmount = paymentPlanDetails?.total_amount || requestData.payment_links?.plan_total_amount || 0;
          let totalPaid = 0;
          
          schedules.forEach(schedule => {
            if (
              schedule.payment_request_id && 
              schedule.payment_requests?.payment_id
            ) {
              totalPaid += schedule.amount || 0;
            }
          });
          
          const totalOutstanding = totalAmount - totalPaid;
          
          planData = {
            schedules,
            totalAmount,
            totalPaid,
            totalOutstanding
          };
        }
      }
      
      const clinic = {
        id: requestData.clinics.id,
        name: requestData.clinics.clinic_name,
        logo: requestData.clinics.logo_url,
        email: requestData.clinics.email,
        phone: requestData.clinics.phone,
        address: [
          requestData.clinics.address_line_1,
          requestData.clinics.address_line_2,
          requestData.clinics.city,
          requestData.clinics.postcode
        ].filter(Boolean).join(', '),
        stripeStatus: requestData.clinics.stripe_status
      };

      const amount = requestData.custom_amount || (requestData.payment_links?.amount || 0);

      return {
        id: requestData.id,
        title: requestData.payment_links?.title,
        type: requestData.payment_links?.type,
        amount: amount / 100, // Convert from cents
        description: requestData.payment_links?.description,
        clinic,
        status, // Use status from plan if it's a payment plan
        isRequest: true,
        patientName: requestData.patient_name,
        patientEmail: requestData.patient_email,
        patientPhone: requestData.patient_phone,
        paymentId: requestData.payment_id,
        paymentPlan: requestData.payment_links?.payment_plan || false,
        planTotalAmount: planData?.totalAmount ? planData.totalAmount / 100 : null,
        totalPaid: planData?.totalPaid ? planData.totalPaid / 100 : null,
        totalOutstanding: planData?.totalOutstanding ? planData.totalOutstanding / 100 : null,
        hasOverduePayments: paymentPlanDetails?.has_overdue_payments || false
      };
    } catch (error) {
      console.error('Exception in fetchPaymentRequest:', error);
      return null;
    }
  },

  async fetchLinks(userId: string) {
    try {
      // Fetch user's clinic ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('Error fetching user data:', userError);
        return { activeLinks: [], archivedLinks: [] };
      }
      
      const clinicId = userData.clinic_id;
      
      // Fetch active payment links
      const { data: activeLinks, error: activeError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (activeError) {
        console.error('Error fetching active payment links:', activeError);
        return { activeLinks: [], archivedLinks: [] };
      }
      
      // Fetch archived payment links
      const { data: archivedLinks, error: archivedError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', false)
        .order('created_at', { ascending: false });
        
      if (archivedError) {
        console.error('Error fetching archived payment links:', archivedError);
        return { activeLinks: [], archivedLinks: [] };
      }
      
      return { activeLinks, archivedLinks };
    } catch (error) {
      console.error('Error fetching payment links:', error);
      return { activeLinks: [], archivedLinks: [] };
    }
  },
  
  async archivePaymentLink(linkId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .update({ is_active: false })
        .eq('id', linkId);
        
      if (error) {
        console.error('Error archiving payment link:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error archiving payment link:', error);
      return { success: false, error: 'Failed to archive payment link' };
    }
  },
  
  async unarchivePaymentLink(linkId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .update({ is_active: true })
        .eq('id', linkId);
        
      if (error) {
        console.error('Error unarchiving payment link:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error unarchiving payment link:', error);
      return { success: false, error: 'Failed to unarchive payment link' };
    }
  }
};
