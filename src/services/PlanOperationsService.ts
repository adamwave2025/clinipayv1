
import { Plan } from '@/utils/planTypes';
import { PlanCancelService } from './plan-operations/PlanCancelService';
import { PlanPauseService } from './plan-operations/PlanPauseService';
import { PlanResumeService } from './plan-operations/PlanResumeService';
import { PlanRescheduleService } from './plan-operations/PlanRescheduleService';

/**
 * Consolidated service for payment plan operations
 * This service delegates to specialized services for specific operations
 */
export class PlanOperationsService {
  /**
   * Cancel a payment plan
   * @param plan The plan to cancel
   * @returns boolean indicating success or failure 
   */
  static async cancelPlan(plan: Plan): Promise<boolean> {
    // Delegate directly to PlanCancelService without duplicating activity logging
    return PlanCancelService.cancelPlan(plan);
  }
  
  /**
   * Pause a payment plan
   * @param plan The plan to pause
   * @returns boolean indicating success or failure
   */
  static async pausePlan(plan: Plan, reason?: string): Promise<boolean> {
    return PlanPauseService.pausePlan(plan, reason);
  }
  
  /**
   * Resume a paused payment plan
   * @param plan The plan to resume
   * @param resumeDate The date to resume payments from
   * @returns boolean indicating success or failure
   */
  static async resumePlan(plan: Plan, resumeDate: Date): Promise<boolean> {
    return PlanResumeService.resumePlan(plan, resumeDate);
  }
  
  /**
   * Reschedule a payment plan
   * @param plan The plan to reschedule
   * @param newStartDate The new start date for the plan
   * @returns boolean indicating success or failure
   */
  static async reschedulePlan(plan: Plan, newStartDate: Date): Promise<boolean> {
    return PlanRescheduleService.reschedulePlan(plan, newStartDate);
  }
}
