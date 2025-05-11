import { Plan } from '@/utils/planTypes';
import { toast } from 'sonner';
import { PlanPauseService } from './plan-operations/PlanPauseService';
import { PlanResumeService } from './plan-operations/PlanResumeService';
import { PlanCancelService } from './plan-operations/PlanCancelService';
import { PlanRescheduleService } from './plan-operations/PlanRescheduleService';
import { PlanPaymentService } from './plan-operations/PlanPaymentService';

/**
 * Consolidated service for plan operations like pausing, resuming, cancelling
 * This service acts as a facade to the specialized service classes.
 */
export class PlanOperationsService {
  /**
   * Resume a paused plan
   * @param plan The plan to resume
   * @param resumeDate Optional date to resume the plan (defaults to tomorrow)
   * @returns Promise<boolean> indicating success or failure
   */
  static async resumePlan(plan: Plan, resumeDate?: Date): Promise<boolean> {
    try {
      const result = await PlanResumeService.resumePlan(plan, resumeDate);
      
      if (!result) {
        toast.error('Failed to resume plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error in resumePlan:', error);
      toast.error(`Failed to resume plan: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Pause a payment plan
   * @param plan The plan to pause
   * @returns boolean indicating success or failure
   */
  static async pausePlan(plan: Plan): Promise<boolean> {
    try {
      const result = await PlanPauseService.pausePlan(plan);
      
      if (!result) {
        toast.error('Failed to pause plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error in pausePlan:', error);
      toast.error(`Failed to pause plan: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Cancel a payment plan
   * @param plan The plan to cancel
   * @returns boolean indicating success or failure
   */
  static async cancelPlan(plan: Plan): Promise<boolean> {
    try {
      const result = await PlanCancelService.cancelPlan(plan);
      
      if (!result) {
        toast.error('Failed to cancel plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error in cancelPlan:', error);
      toast.error(`Failed to cancel plan: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Reschedule a payment plan with a new start date
   * @param plan The plan to reschedule
   * @param newStartDate The new start date for the plan
   * @returns boolean indicating success or failure
   */
  static async reschedulePlan(plan: Plan, newStartDate: Date): Promise<boolean> {
    try {
      const result = await PlanRescheduleService.reschedulePlan(plan, newStartDate);
      
      if (!result) {
        toast.error('Failed to reschedule plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error in reschedulePlan:', error);
      toast.error(`Failed to reschedule plan: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Reschedule an individual payment to a new date
   * @param paymentId The payment ID to reschedule
   * @param newDate The new date for the payment
   * @returns Object indicating success or failure
   */
  static async reschedulePayment(paymentId: string, newDate: Date): Promise<{ success: boolean, error?: any }> {
    try {
      const result = await PlanPaymentService.reschedulePayment(paymentId, newDate);
      
      if (!result.success) {
        toast.error('Failed to reschedule payment');
      }
      
      return result;
    } catch (error) {
      console.error('Error in reschedulePayment:', error);
      toast.error(`Failed to reschedule payment: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error };
    }
  }
  
  /**
   * Record a refund for a payment
   * @param paymentId The payment ID to refund
   * @param amount The refund amount
   * @param isFullRefund Whether this is a full refund
   * @returns Object indicating success or failure
   */
  static async recordPaymentRefund(paymentId: string, amount: number, isFullRefund: boolean): Promise<{ success: boolean, error?: any }> {
    try {
      return await PlanPaymentService.recordPaymentRefund(paymentId, amount, isFullRefund);
    } catch (error) {
      console.error('Error in recordPaymentRefund:', error);
      toast.error(`Failed to record refund: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error };
    }
  }
  
  /**
   * Send a payment reminder for an installment
   * @param installmentId The installment ID to send a reminder for
   * @returns Object indicating success or failure
   */
  static async sendPaymentReminder(installmentId: string): Promise<{ success: boolean, error?: any }> {
    try {
      return await PlanPaymentService.sendPaymentReminder(installmentId);
    } catch (error) {
      console.error('Error in sendPaymentReminder:', error);
      toast.error(`Failed to send payment reminder: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error };
    }
  }
}
