
import { supabase } from '@/integrations/supabase/client';
import { BasePaymentLinkService } from './BasePaymentLinkService';

/**
 * Service class for archiving and unarchiving payment links
 */
export class PaymentLinkArchiveService extends BasePaymentLinkService {
  /**
   * Archives a payment link by setting is_active to false
   */
  static async archiveLink(linkId: string) {
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
      this.handleError(error, 'Error archiving payment link');
      return { success: false, error };
    }
  }

  /**
   * Unarchives a payment link by setting is_active to true
   */
  static async unarchiveLink(linkId: string) {
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
      this.handleError(error, 'Error unarchiving payment link');
      return { success: false, error };
    }
  }
}
