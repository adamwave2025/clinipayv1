
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';

export const PaymentLinkService = {
  async fetchLinks(clinicId: string) {
    try {
      console.log(`Fetching payment links for clinic: ${clinicId}`);
      
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
        console.error('Error fetching active links:', activeLinksError);
        throw activeLinksError;
      }

      if (archivedLinksError) {
        console.error('Error fetching archived links:', archivedLinksError);
        throw archivedLinksError;
      }

      // Debug logging for payment plan links
      console.log(`Found ${activeLinksData?.length || 0} active links`);
      console.log(`Found ${archivedLinksData?.length || 0} archived links`);
      
      // Log payment plan links specifically to help with debugging
      if (activeLinksData) {
        const paymentPlans = activeLinksData.filter(link => 
          link.payment_plan === true || link.type === 'payment_plan'
        );
        console.log(`Found ${paymentPlans.length} active payment plan links:`, 
          paymentPlans.map(p => ({ id: p.id, title: p.title, payment_plan: p.payment_plan, type: p.type }))
        );
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
      // Enhanced logging to debug payment plan issues
      console.log('PaymentLinkService: Creating link with original data:', JSON.stringify(linkData, null, 2));
      
      // Ensure a clinic_id is provided
      if (!linkData.clinic_id) {
        throw new Error('No clinic_id provided');
      }
      
      // Make a copy to prevent modifying original data
      const dataToInsert = { ...linkData };
      
      // CRITICAL FIX: Force payment_plan to true for payment_plan type
      if (dataToInsert.type === 'payment_plan') {
        // Force payment_plan to be boolean true, not a string or anything else
        dataToInsert.payment_plan = true;
        console.log('Forcing payment_plan to TRUE for payment_plan type');
        
        // Ensure all required fields for payment plans are present
        if (!dataToInsert.payment_count || !dataToInsert.payment_cycle) {
          throw new Error('Payment plan requires payment_count and payment_cycle');
        }
      } else {
        // For non-payment plans, explicitly set to false
        dataToInsert.payment_plan = false;
      }
      
      console.log('FINAL DATA TO INSERT:', JSON.stringify(dataToInsert, null, 2));
      
      // Insert data into database with specific type definitions
      const { data, error } = await supabase
        .from('payment_links')
        .insert([dataToInsert])
        .select();

      if (error) {
        console.error('Supabase error creating payment link:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from payment link creation');
      }
      
      // Verify the payment_plan flag was set correctly
      console.log('DATA RETURNED FROM DB:', JSON.stringify(data, null, 2));
      
      if (dataToInsert.payment_plan === true && data[0].payment_plan !== true) {
        console.error('WARNING: payment_plan was true in request but not true in response!', {
          requestedValue: dataToInsert.payment_plan,
          returnedValue: data[0].payment_plan
        });
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
