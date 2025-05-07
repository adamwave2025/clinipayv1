
import { useState } from 'react';
import { isPaymentStatusTransitionValid, isPaymentStatusModifiable } from '@/utils/paymentStatusUtils';
import { toast } from 'sonner';

/**
 * Hook to safely handle payment status updates
 * This hook provides safety checks to ensure payment statuses are not modified incorrectly
 */
export const usePaymentStatusHandler = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  /**
   * Safely update a payment status with validation
   * @param currentStatus The current payment status
   * @param newStatus The new status to update to
   * @param updateFn The function to call if the transition is valid
   * @returns Promise<boolean> indicating if the update was successful
   */
  const safelyUpdateStatus = async (
    currentStatus: string | null | undefined,
    newStatus: string,
    updateFn: () => Promise<boolean>
  ): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      // Check if the payment can be modified
      if (!isPaymentStatusModifiable(currentStatus)) {
        console.error('Cannot update status: Paid payments cannot be modified', {
          currentStatus,
          newStatus
        });
        toast.error('Cannot update this payment - paid payments cannot be modified');
        return false;
      }
      
      // Check if the status transition is valid
      if (!isPaymentStatusTransitionValid(currentStatus, newStatus)) {
        console.error('Invalid status transition', {
          currentStatus,
          newStatus
        });
        toast.error(`Invalid status transition from ${currentStatus || 'none'} to ${newStatus}`);
        return false;
      }
      
      // Call the update function
      return await updateFn();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  return {
    isUpdating,
    safelyUpdateStatus
  };
};
