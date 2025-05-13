
// Import the correct type from the paymentLink file
import { PaymentLinkData } from '../types/paymentLink';

/**
 * Determines if a payment link is active based on its status and isActive property
 * @param linkData The payment link data to check
 * @returns True if the link is active, false otherwise
 */
export function isPaymentLinkActive(linkData: PaymentLinkData): boolean {
  if (!linkData) return false;
  
  // A link is considered active if:
  // 1. It has an explicit isActive property set to true, OR
  // 2. It has a status of 'active'
  const explicitlyActive = linkData.isActive === true;
  const activeByStatus = linkData.status === 'active';
  
  console.log('Link activity check:', {
    id: linkData.id,
    explicitlyActive,
    activeByStatus,
    result: explicitlyActive || activeByStatus
  });
  
  return explicitlyActive || activeByStatus;
}
