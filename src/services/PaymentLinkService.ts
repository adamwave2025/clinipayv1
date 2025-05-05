
import { PaymentLinkFetchService } from './payment-links/PaymentLinkFetchService';
import { PaymentLinkArchiveService } from './payment-links/PaymentLinkArchiveService';
import { PaymentLinkMutationService } from './payment-links/PaymentLinkMutationService';
import { BasePaymentLinkService } from './payment-links/BasePaymentLinkService';

/**
 * Main PaymentLinkService that acts as a facade for all payment link operations.
 * This service delegates operations to specialized services for better organization.
 */
export const PaymentLinkService = {
  /**
   * Fetches both active and archived links for a clinic
   */
  fetchLinks: PaymentLinkFetchService.fetchLinks,
  
  /**
   * Archives a payment link
   */
  archiveLink: PaymentLinkArchiveService.archiveLink,
  
  /**
   * Unarchives a payment link
   */
  unarchiveLink: PaymentLinkArchiveService.unarchiveLink,
  
  /**
   * Creates a new payment link
   */
  createLink: PaymentLinkMutationService.createLink,
  
  /**
   * Updates an existing payment link
   */
  updateLink: PaymentLinkMutationService.updateLink,
  
  /**
   * Fetches a payment request with clinic data
   */
  fetchPaymentRequest: BasePaymentLinkService.fetchPaymentRequest,
  
  /**
   * Fetches a payment link with clinic data
   */
  fetchPaymentLink: BasePaymentLinkService.fetchPaymentLink
};
