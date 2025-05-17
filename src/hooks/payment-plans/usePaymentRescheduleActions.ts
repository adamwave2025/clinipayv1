
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { toast } from 'sonner';

export const usePaymentRescheduleActions = (
  planId: string,
  onPaymentRescheduled?: (planId: string) => Promise<void>
) => {
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [maxAllowedDate, setMaxAllowedDate] = useState<Date | undefined>(undefined);
  
  const handleOpenRescheduleDialog = async (paymentId: string): Promise<void> => {
    console.log("[usePaymentRescheduleActions] Opening reschedule dialog for payment:", paymentId);
    setSelectedPaymentId(paymentId);
    
    try {
      // Get the current payment's information
      const { data: currentPayment, error: paymentError } = await supabase
        .from('payment_schedule')
        .select('id, payment_number, due_date')
        .eq('id', paymentId)
        .single();
      
      if (paymentError) {
        console.error('Error fetching current payment details:', paymentError);
        throw paymentError;
      }
      
      // Find the next payment after this one
      const { data: nextPayment, error: nextPaymentError } = await supabase
        .from('payment_schedule')
        .select('id, due_date')
        .eq('plan_id', planId)
        .gt('payment_number', currentPayment.payment_number)
        .order('payment_number', { ascending: true })
        .limit(1)
        .single();
      
      if (nextPaymentError && nextPaymentError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
        console.error('Error fetching next payment details:', nextPaymentError);
      }
      
      // If there's a next payment, set its due date as the max allowed date
      if (nextPayment && nextPayment.due_date) {
        // Subtract one day from next payment date to prevent scheduling on the same day
        const nextDate = new Date(nextPayment.due_date);
        nextDate.setDate(nextDate.getDate() - 1);
        setMaxAllowedDate(nextDate);
        console.log("Setting max allowed date to:", nextDate.toISOString());
      } else {
        // If no next payment, don't set a max date restriction
        setMaxAllowedDate(undefined);
        console.log("No next payment found, no max date restriction applied");
      }
      
    } catch (error) {
      console.error("Error determining date restrictions:", error);
      // Even if there's an error, still open dialog but without restrictions
      setMaxAllowedDate(undefined);
    }
    
    setShowRescheduleDialog(true);
    
    // Debug log to verify state is being set correctly
    setTimeout(() => {
      console.log("[usePaymentRescheduleActions] Dialog state after update:", showRescheduleDialog, "selectedPaymentId:", selectedPaymentId);
    }, 100);
  };
  
  const handleReschedulePayment = async (newDate: Date) => {
    if (!selectedPaymentId) {
      toast.error('No payment selected for rescheduling');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log(`Rescheduling payment ${selectedPaymentId} to ${newDate.toISOString()}`);
      
      // Get payment data before rescheduling to log activity properly
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('id, due_date, payment_request_id, status, plan_id')
        .eq('id', selectedPaymentId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching payment data:", fetchError);
        toast.error('Failed to fetch payment data for rescheduling');
        return { success: false, error: fetchError };
      }
      
      // If payment has an associated payment request, cancel it first
      if (paymentData.payment_request_id) {
        console.log(`Cancelling existing payment request ${paymentData.payment_request_id}`);
        
        const { error: cancelError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled'
          })
          .eq('id', paymentData.payment_request_id);
        
        if (cancelError) {
          console.error("Error cancelling existing payment request:", cancelError);
          toast.error('Failed to cancel existing payment request');
          return { success: false, error: cancelError };
        } else {
          console.log("Successfully cancelled existing payment request");
        }
      }
      
      // Use the service to reschedule the payment
      const result = await PlanOperationsService.reschedulePayment(selectedPaymentId, newDate);
      
      if (result.success) {
        toast.success('Payment rescheduled successfully');
        
        // Close dialog
        setShowRescheduleDialog(false);
        
        // Refresh data if callback provided
        if (onPaymentRescheduled && planId) {
          await onPaymentRescheduled(planId);
        }
        
        return { success: true };
      } else {
        toast.error('Failed to reschedule payment');
        console.error('Error rescheduling payment:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error in handleReschedulePayment:', error);
      toast.error('An error occurred while rescheduling the payment');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
      setSelectedPaymentId(null);
    }
  };

  return {
    showRescheduleDialog,
    setShowRescheduleDialog,
    isProcessing,
    selectedPaymentId,
    maxAllowedDate,
    handleOpenRescheduleDialog,
    handleReschedulePayment
  };
};
