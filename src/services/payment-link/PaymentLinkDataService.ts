
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for fetching payment link data
 */
export class PaymentLinkDataService {
  /**
   * Fetches a payment request with associated clinic data
   */
  static async fetchPaymentRequestWithClinic(requestId: string) {
    try {
      console.log(`PaymentLinkDataService: Fetching payment request with ID: ${requestId}`);
      const { data, error } = await supabase
        .from("payment_requests")
        .select(`
          *,
          clinics:clinic_id (*),
          payment_links(*)
        `)
        .eq("id", requestId)
        .single();
        
      if (error) {
        console.error("PaymentLinkDataService: Error fetching payment request:", error);
        return null;
      }
      
      console.log("PaymentLinkDataService: Successfully fetched payment request data");
      return data;
    } catch (error) {
      console.error("PaymentLinkDataService: Exception fetching payment request:", error);
      return null;
    }
  }

  /**
   * Fetches a payment link with associated clinic data
   */
  static async fetchPaymentLinkWithClinic(linkId: string) {
    try {
      console.log(`PaymentLinkDataService: Fetching payment link with ID: ${linkId}`);
      const { data, error } = await supabase
        .from("payment_links")
        .select(`
          *,
          clinics:clinic_id (*)
        `)
        .eq("id", linkId)
        .single();
        
      if (error) {
        console.error("PaymentLinkDataService: Error fetching payment link:", error);
        return null;
      }
      
      console.log("PaymentLinkDataService: Successfully fetched payment link data");
      return data;
    } catch (error) {
      console.error("PaymentLinkDataService: Exception fetching payment link:", error);
      return null;
    }
  }
}
