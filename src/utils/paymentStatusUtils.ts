
/**
 * Utility functions for validating payment status transitions and handling payment statuses
 */

/**
 * Allowed payment status transitions map
 * This defines which status transitions are valid
 */
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  'pending': ['paid', 'cancelled', 'overdue', 'paused', 'sent'],
  'sent': ['paid', 'cancelled', 'paused', 'overdue'],  // Added 'overdue' as valid transition
  'paid': ['refunded', 'partially_refunded'],
  'overdue': ['paid', 'cancelled', 'paused'],
  'paused': ['pending', 'cancelled', 'sent'],  // Added 'sent' as valid transition
  'cancelled': [],
  'refunded': [],
  'partially_refunded': ['refunded']
};

/**
 * Check if a payment status transition is valid
 * @param currentStatus The current status of the payment
 * @param newStatus The new status to transition to
 * @returns boolean indicating if the transition is valid
 */
export const isPaymentStatusTransitionValid = (
  currentStatus: string | null | undefined, 
  newStatus: string
): boolean => {
  // If there's no current status, any new status is valid
  if (!currentStatus) return true;
  
  // If the status isn't changing, it's valid
  if (currentStatus === newStatus) return true;
  
  // Check if the transition is allowed
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Check if a payment status is considered "paid" (including refund states)
 * @param status The payment status to check
 * @returns boolean indicating if the status is considered paid
 */
export const isPaymentStatusPaid = (status: string | null | undefined): boolean => {
  if (!status) return false;
  return ['paid', 'refunded', 'partially_refunded'].includes(status);
};

/**
 * Check if a payment status can be modified (not paid or refunded)
 * @param status The payment status to check
 * @returns boolean indicating if the status can be modified
 */
export const isPaymentStatusModifiable = (status: string | null | undefined): boolean => {
  if (!status) return true;
  return ['pending', 'overdue', 'paused', 'sent'].includes(status);  // Added 'overdue' as modifiable status
};

/**
 * Get a list of installment statuses that can be modified (not paid or refunded)
 * @returns string[] array of modifiable statuses
 */
export const getModifiableStatuses = (): string[] => {
  return ['pending', 'overdue', 'paused', 'sent'];  // Added 'overdue' as modifiable status
};
