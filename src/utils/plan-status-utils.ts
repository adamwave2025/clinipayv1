
import { Plan } from '@/utils/planTypes';
import { PlanStatusService } from '@/services/PlanStatusService';

/**
 * Check if a plan is currently paused
 */
export const isPlanPaused = (plan: Plan | null): boolean => {
  return PlanStatusService.isPlanPaused(plan);
};

/**
 * Check if a plan is currently active
 */
export const isPlanActive = (plan: Plan | null): boolean => {
  return PlanStatusService.isPlanActive(plan);
};

/**
 * Check if a plan is cancelled or completed
 */
export const isPlanFinished = (plan: Plan | null): boolean => {
  return PlanStatusService.isPlanFinished(plan);
};
