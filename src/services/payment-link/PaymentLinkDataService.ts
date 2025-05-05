
import { PaymentLinkService } from '../PaymentLinkService';

/**
 * Service for fetching payment link data
 */
export const PaymentLinkDataService = {
  /**
   * Fetches a payment link with related clinic data
   */
  async fetchPaymentLinkWithClinic(linkId: string) {
    return PaymentLinkService.fetchPaymentLink(linkId);
  },
  
  /**
   * Fetches a payment request with related clinic data
   */
  async fetchPaymentRequestWithClinic(requestId: string) {
    return PaymentLinkService.fetchPaymentRequest(requestId);
  }
};
