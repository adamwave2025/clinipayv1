
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
      
      // First, fetch the payment request to get the payment_link_id
      const { data: requestData, error: requestError } = await supabase
        .from("payment_requests")
        .select(`
          *,
          clinics:clinic_id (*),
          payment_links(*)
        `)
        .eq("id", requestId)
        .single();
        
      if (requestError) {
        console.error("PaymentLinkDataService: Error fetching payment request:", requestError);
        return null;
      }
      
      // If this is a payment plan, get total paid amount from payments table
      if (requestData?.payment_links?.payment_plan === true) {
        const paymentLinkId = requestData.payment_link_id;
        
        // Fetch the total paid amount for this plan
        if (paymentLinkId) {
          console.log(`PaymentLinkDataService: Fetching payment history for payment link ID: ${paymentLinkId}`);
          const { data: paymentsData, error: paymentsError } = await supabase
            .from("payments")
            .select("amount_paid")
            .eq("payment_link_id", paymentLinkId)
            .eq("status", "paid");
            
          if (!paymentsError && paymentsData) {
            // Calculate the total paid amount
            const totalPaidAmount = paymentsData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
            console.log(`PaymentLinkDataService: Total paid amount: ${totalPaidAmount} for payment link ID: ${paymentLinkId}`);
            
            // Add the total paid to the request data
            // Use a direct property assignment instead of trying to modify 'requestData.total_paid'
            const updatedRequestData = {
              ...requestData,
              total_paid_amount: totalPaidAmount
            };
            
            console.log("PaymentLinkDataService: Successfully fetched payment request data with total paid");
            return updatedRequestData;
          } else if (paymentsError) {
            console.error("PaymentLinkDataService: Error fetching payments:", paymentsError);
          }
        }
      }
      
      console.log("PaymentLinkDataService: Successfully fetched payment request data");
      return requestData;
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
      
      // Fetch the payment link data
      const { data: linkData, error: linkError } = await supabase
        .from("payment_links")
        .select(`
          *,
          clinics:clinic_id (*)
        `)
        .eq("id", linkId)
        .single();
        
      if (linkError) {
        console.error("PaymentLinkDataService: Error fetching payment link:", linkError);
        return null;
      }
      
      // If this is a payment plan, fetch total paid amount
      if (linkData.payment_plan === true) {
        console.log(`PaymentLinkDataService: Fetching payment history for payment plan link ID: ${linkId}`);
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("amount_paid")
          .eq("payment_link_id", linkId)
          .eq("status", "paid");
          
        if (!paymentsError && paymentsData) {
          // Calculate the total paid amount
          const totalPaidAmount = paymentsData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
          console.log(`PaymentLinkDataService: Total paid amount: ${totalPaidAmount} for payment link ID: ${linkId}`);
          
          // Add the total paid to the link data
          // Use a direct property assignment instead of modifying 'linkData.total_paid'
          const updatedLinkData = {
            ...linkData,
            total_paid_amount: totalPaidAmount
          };
          
          console.log("PaymentLinkDataService: Successfully fetched payment link data with total paid");
          return updatedLinkData;
        } else if (paymentsError) {
          console.error("PaymentLinkDataService: Error fetching payments:", paymentsError);
        }
      }
      
      console.log("PaymentLinkDataService: Successfully fetched payment link data");
      return linkData;
    } catch (error) {
      console.error("PaymentLinkDataService: Exception fetching payment link:", error);
      return null;
    }
  }
}
