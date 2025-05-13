
/**
 * Utility functions for checking plan status
 */
import { Plan } from './planTypes';

/**
 * Check if a payment plan is paused
 */
export const isPlanPaused = (plan: Plan | null): boolean => {
  if (!plan) return false;
  
  return plan.status?.toLowerCase() === 'paused';
};

/**
 * Check if a payment plan is completed
 */
export const isPlanCompleted = (plan: Plan | null): boolean => {
  if (!plan) return false;
  
  return plan.status?.toLowerCase() === 'completed';
};

/**
 * Check if a payment plan is cancelled
 */
export const isPlanCancelled = (plan: Plan | null): boolean => {
  if (!plan) return false;
  
  return plan.status?.toLowerCase() === 'cancelled';
};

/**
 * Check if a payment plan is active (not paused, completed, or cancelled)
 */
export const isPlanActive = (plan: Plan | null): boolean => {
  if (!plan) return false;
  
  return !isPlanPaused(plan) && !isPlanCompleted(plan) && !isPlanCancelled(plan);
};

/**
 * Check if a payment plan has overdue payments
 */
export const hasPlanOverduePayments = (plan: Plan | null): boolean => {
  if (!plan) return false;
  
  return plan.status?.toLowerCase() === 'overdue';
};

/**
 * Get a human-readable status description for a plan
 */
export const getPlanStatusDescription = (plan: Plan | null): string => {
  if (!plan) return 'Unknown';
  
  const status = plan.status?.toLowerCase() || '';
  
  switch (status) {
    case 'active':
      return 'Active';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'overdue':
      return 'Overdue';
    case 'pending':
      return 'Pending activation';
    default:
      return plan.status || 'Unknown';
  }
};
