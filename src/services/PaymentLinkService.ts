
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
      // Improved logging to debug payment plan issues
      console.log('Creating link with original data:', JSON.stringify(linkData, null, 2));
      
      // Ensure a clinic_id is provided
      if (!linkData.clinic_id) {
        throw new Error('No clinic_id provided');
      }
      
      // Make a copy to prevent modifying original data
      const dataToInsert = { ...linkData };
      
      // CRITICAL: Handle the payment_plan field explicitly
      // Ensure payment_plan is a boolean true if specified
      if (dataToInsert.payment_plan === true || dataToInsert.payment_plan === 'true') {
        // Explicitly set to boolean true
        dataToInsert.payment_plan = true;
        
        console.log('Creating payment plan with validated properties:', {
          payment_plan: dataToInsert.payment_plan,
          payment_count: dataToInsert.payment_count,
          payment_cycle: dataToInsert.payment_cycle,
          plan_total_amount: dataToInsert.plan_total_amount
        });
        
        // Validate required payment plan fields
        if (!dataToInsert.payment_count || !dataToInsert.payment_cycle) {
          throw new Error('Payment plan requires payment_count and payment_cycle');
        }
        
        // Ensure payment_count is a number
        if (typeof dataToInsert.payment_count === 'string') {
          dataToInsert.payment_count = parseInt(dataToInsert.payment_count, 10);
        }
        
        // Calculate plan_total_amount if not provided
        if (!dataToInsert.plan_total_amount && dataToInsert.amount && dataToInsert.payment_count) {
          dataToInsert.plan_total_amount = dataToInsert.amount * dataToInsert.payment_count;
        }
      } else {
        // Explicitly set to false if not a payment plan
        dataToInsert.payment_plan = false;
      }
      
      console.log('Final data being sent to database:', JSON.stringify(dataToInsert, null, 2));
      
      // Insert data into database
      const { data, error } = await supabase
        .from('payment_links')
        .insert([dataToInsert])
        .select();

      if (error) {
        console.error('Supabase error creating payment link:', error);
        throw error;
      }
      
      console.log('Link created successfully:', data);
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

  // Add missing methods
  async fetchPaymentRequest(requestId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          clinics:clinic_id (*)
        `)
        .eq('id', requestId)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching payment request:', error);
      return null;
    }
  },
  
  async fetchPaymentLink(linkId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select(`
          *,
          clinics:clinic_id (*)
        `)
        .eq('id', linkId)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching payment link:', error);
      return null;
    }
  }
};
