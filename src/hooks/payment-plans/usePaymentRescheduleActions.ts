
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { toast } from '@/hooks/use-toast';

export const usePaymentRescheduleActions = (
  planId: string,
  onPaymentRescheduled?: (planId: string) => Promise<void>
) => {
  const [showReschedulePaymentDialog, setShowReschedulePaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  
  const handleOpenRescheduleDialog = (paymentId: string) => {
    console.log("usePaymentRescheduleActions: Opening reschedule dialog for payment", paymentId);
    setSelectedPaymentId(paymentId);
    setShowReschedulePaymentDialog(true);
    console.log("usePaymentRescheduleActions: Dialog state after opening:", showReschedulePaymentDialog);
    // Using setTimeout to check the state after the React update cycle
    setTimeout(() => {
      console.log("usePaymentRescheduleActions: Dialog state after timeout:", showReschedulePaymentDialog);
    }, 0);
  };
  
  const handleReschedulePayment = async (newDate: Date) => {
    if (!selectedPaymentId) {
      toast({
        title: "Error",
        description: 'No payment selected for rescheduling',
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log(`Rescheduling payment ${selectedPaymentId} to ${newDate.toISOString()}`);
      
      // Use the service to reschedule the payment
      const result = await PlanOperationsService.reschedulePayment(selectedPaymentId, newDate);
      
      if (result.success) {
        toast({
          title: "Success",
          description: 'Payment rescheduled successfully'
        });
        
        // Close dialog
        setShowReschedulePaymentDialog(false);
        
        // Refresh data if callback provided
        if (onPaymentRescheduled && planId) {
          await onPaymentRescheduled(planId);
        }
      } else {
        toast({
          title: "Error",
          description: 'Failed to reschedule payment',
          variant: "destructive"
        });
        console.error('Error rescheduling payment:', result.error);
      }
    } catch (error) {
      console.error('Error in handleReschedulePayment:', error);
      toast({
        title: "Error",
        description: 'An error occurred while rescheduling the payment',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setSelectedPaymentId(null);
    }
  };

  return {
    showRescheduleDialog: showReschedulePaymentDialog, // Keep old name for backwards compatibility
    setShowRescheduleDialog: setShowReschedulePaymentDialog, // Keep old name for backwards compatibility
    showReschedulePaymentDialog,
    setShowReschedulePaymentDialog,
    isProcessing,
    selectedPaymentId,
    handleOpenRescheduleDialog,
    handleReschedulePayment
  };
};
