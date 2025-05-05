
import { supabase } from '@/integrations/supabase/client';
import { BasePaymentLinkService } from './BasePaymentLinkService';

/**
 * Service class focused on fetching payment links
 */
export class PaymentLinkFetchService extends BasePaymentLinkService {
  /**
   * Fetches both active and archived payment links for a clinic
   */
  static async fetchLinks(clinicId: string) {
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
      this.handleError(error, 'Error fetching payment links');
      return { activeLinks: [], archivedLinks: [] };
    }
  }
}
