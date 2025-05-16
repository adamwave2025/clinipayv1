
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
  
  const handleOpenRescheduleDialog = (paymentId: string) => {
    console.log("usePaymentRescheduleActions: Opening reschedule dialog for payment", paymentId);
    setSelectedPaymentId(paymentId);
    setShowRescheduleDialog(true);
    console.log("usePaymentRescheduleActions: Dialog state after opening:", showRescheduleDialog);
    // Using setTimeout to check the state after the React update cycle
    setTimeout(() => {
      console.log("usePaymentRescheduleActions: Dialog state after timeout:", showRescheduleDialog);
    }, 0);
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
        .select('id, due_date, payment_request_id, status, plan_id, patient_id')
        .eq('id', selectedPaymentId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching payment data:", fetchError);
        toast.error('Failed to fetch payment data for rescheduling');
        return;
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
        } else {
          console.log("Successfully cancelled existing payment request");
        }
      }
      
      // Use the service to reschedule the payment
      const result = await PlanOperationsService.reschedulePayment(selectedPaymentId, newDate);
      
      if (result.success) {
        toast.success('Payment rescheduled successfully');
        
        // Get plan details to log activity properly
        if (paymentData.plan_id) {
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('id, clinic_id, payment_link_id')
            .eq('id', paymentData.plan_id)
            .single();
            
          if (!planError && planData) {
            // Log activity
            await supabase.from('payment_activity').insert({
              action_type: 'payment_rescheduled',
              plan_id: paymentData.plan_id,
              patient_id: paymentData.patient_id,
              clinic_id: planData.clinic_id,
              payment_link_id: planData.payment_link_id,
              details: {
                payment_id: selectedPaymentId,
                previous_date: paymentData.due_date,
                new_date: newDate.toISOString().split('T')[0],
                had_payment_request: paymentData.payment_request_id !== null
              }
            });
          }
        }
        
        // Close dialog
        setShowRescheduleDialog(false);
        
        // Refresh data if callback provided
        if (onPaymentRescheduled && planId) {
          await onPaymentRescheduled(planId);
        }
      } else {
        toast.error('Failed to reschedule payment');
        console.error('Error rescheduling payment:', result.error);
      }
    } catch (error) {
      console.error('Error in handleReschedulePayment:', error);
      toast.error('An error occurred while rescheduling the payment');
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
    handleOpenRescheduleDialog,
    handleReschedulePayment
  };
};
