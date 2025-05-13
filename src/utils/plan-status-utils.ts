
import { Plan } from './planTypes';

/**
 * Utility functions for determining plan status
 */

/**
 * Check if a plan is paused
 */
export const isPlanPaused = (plan: Plan | null): boolean => {
  if (!plan) return false;
  return plan.status === 'paused';
};

/**
 * Check if a plan is active
 */
export const isPlanActive = (plan: Plan | null): boolean => {
  if (!plan) return false;
  return ['active', 'pending'].includes(plan.status);
};

/**
 * Check if a plan is completed
 */
export const isPlanCompleted = (plan: Plan | null): boolean => {
  if (!plan) return false;
  return plan.status === 'completed';
};

/**
 * Check if a plan is cancelled
 */
export const isPlanCancelled = (plan: Plan | null): boolean => {
  if (!plan) return false;
  return plan.status === 'cancelled';
};

/**
 * Get a human-readable status text
 */
export const getPlanStatusText = (plan: Plan | null): string => {
  if (!plan) return 'Unknown';
  
  switch (plan.status) {
    case 'active': return 'Active';
    case 'paused': return 'Paused';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'pending': return 'Pending';
    default: return plan.status || 'Unknown';
  }
};
