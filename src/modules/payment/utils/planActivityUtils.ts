
import { PaymentLinkData } from '../types/paymentLink';

/**
 * Check if a payment link is active based on its status
 * 
 * @param linkData The payment link data
 * @returns Boolean indicating if the link is active
 */
export function isPaymentLinkActive(linkData: PaymentLinkData | null): boolean {
  if (!linkData) return false;
  
  // Check status - links with these statuses are not active
  const inactiveStatuses = [
    'cancelled', 
    'completed', 
    'paused', 
    'rescheduled'
  ];
  
  return !inactiveStatuses.includes(linkData.status);
}
