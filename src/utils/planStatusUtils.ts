
import { Plan } from '@/utils/planTypes';

/**
 * Check if a plan is currently paused
 */
export const isPlanPaused = (plan: Plan | null): boolean => {
  if (!plan) return false;
  return plan.status === 'paused';
};

/**
 * Check if a plan is currently active
 */
export const isPlanActive = (plan: Plan | null): boolean => {
  if (!plan) return false;
  return plan.status === 'active' || plan.status === 'overdue';
};

/**
 * Check if a plan is cancelled or completed
 */
export const isPlanFinished = (plan: Plan | null): boolean => {
  if (!plan) return false;
  return plan.status === 'cancelled' || plan.status === 'completed';
};
