
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Base service class for payment link operations
 * Contains common functionality and error handling
 */
export class BasePaymentLinkService {
  /**
   * Handles common error logging
   */
  protected static handleError(error: any, message: string): void {
    console.error(`${message}:`, error);
    toast.error("An error occurred. Please try again.");
  }

  /**
   * Fetches a single payment link with related clinic data
   */
  static async fetchPaymentLink(linkId: string) {
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

  /**
   * Fetches a payment request with related clinic data
   */
  static async fetchPaymentRequest(requestId: string) {
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
  }
}
