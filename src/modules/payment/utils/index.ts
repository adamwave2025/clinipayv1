
// Export all payment utilities

export { formatPaymentLinks } from './paymentLinkFormatter';
export { isPaymentLinkActive, formatPlanActivities } from './planActivityUtils';

// Adds a single central export for all payment utilities
import * as paymentLinkUtils from './paymentLinkFormatter';
import * as planActivityUtils from './planActivityUtils';

export const PaymentUtils = {
  ...paymentLinkUtils,
  ...planActivityUtils
};
