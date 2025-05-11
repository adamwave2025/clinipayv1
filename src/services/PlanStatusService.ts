
import { Plan } from '@/utils/planTypes';
import { PlanStatusCore } from './plan-status/PlanStatusCore';
import { PlanPaymentMetrics } from './plan-status/PlanPaymentMetrics';
import { PlanOverdueChecker } from './plan-status/PlanOverdueChecker';
import { PlanStatusUpdater } from './plan-status/PlanStatusUpdater';

/**
 * Service for managing plan status calculations and validations.
 * This class serves as a facade to the more specialized services.
 * 
 * NOTE: The plan status lifecycle is now managed as follows:
 * - Manual operations (pause/resume/reschedule/cancel) explicitly set status
 * - Payment webhooks update status on payment (overdue -> active, final payment -> completed)
 * - The update-plan-statuses cron job ONLY handles setting overdue status
 */
export class PlanStatusService {
  // Status checking methods from PlanStatusCore
  static isPlanPaused = PlanStatusCore.isPlanPaused;
  static isPlanActive = PlanStatusCore.isPlanActive;
  static isPlanFinished = PlanStatusCore.isPlanFinished;
  static validatePlanStatus = PlanStatusCore.validatePlanStatus;
  static refreshPlanStatus = PlanStatusCore.refreshPlanStatus;
  
  // Payment metrics methods from PlanPaymentMetrics
  static getAccuratePaidInstallmentCount = PlanPaymentMetrics.getAccuratePaidInstallmentCount;
  static calculateProgress = PlanPaymentMetrics.calculateProgress;
  static updatePlanPaymentMetrics = PlanPaymentMetrics.updatePlanPaymentMetrics;
  
  // Overdue checking methods from PlanOverdueChecker
  static checkPlanForOverduePayments = PlanOverdueChecker.checkPlanForOverduePayments;
  static triggerStatusUpdate = PlanOverdueChecker.triggerStatusUpdate;
  
  // Status update methods from PlanStatusUpdater
  static updatePlanOverdueStatus = PlanStatusUpdater.updatePlanOverdueStatus;
  static updatePlanStatus = PlanStatusUpdater.updatePlanStatus;
  static calculatePlanStatus = PlanStatusUpdater.calculatePlanStatus;
}
