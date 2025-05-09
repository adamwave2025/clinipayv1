
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { recordPaymentPlanActivity } from '@/services/PaymentScheduleService';

export function useInstallmentActions(
  planId: string,
  refreshInstallments: () => Promise<void>
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);

  const handleMarkAsPaid = async (installmentId: string) => {
    setIsProcessing(true);
    try {
      // 1. Get the installment details
      const { data: installment, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('id', installmentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // 2. Update the payment_schedule status to 'paid'
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', installmentId);
      
      if (updateError) throw updateError;
      
      // 3. Record the activity
      await recordPaymentPlanActivity({
        planId,
        actionType: 'payment_marked_paid',
        details: {
          installmentId,
          paymentNumber: installment.payment_number,
          amount: installment.amount
        }
      });
      
      // 4. Refresh the installments list
      await refreshInstallments();
      
      toast.success('Payment marked as paid successfully');
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error('Failed to mark payment as paid');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReschedule = (installmentId: string) => {
    setSelectedInstallmentId(installmentId);
    setShowRescheduleDialog(true);
  };

  const handleReschedulePayment = async (newDate: Date) => {
    if (!selectedInstallmentId) return;
    
    setIsProcessing(true);
    try {
      // 1. Get the installment details
      const { data: installment, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('id', selectedInstallmentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // 2. Update the payment_schedule with the new due date
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({
          due_date: newDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInstallmentId);
      
      if (updateError) throw updateError;
      
      // 3. Record the activity
      await recordPaymentPlanActivity({
        planId,
        actionType: 'payment_rescheduled',
        details: {
          installmentId: selectedInstallmentId,
          paymentNumber: installment.payment_number,
          originalDate: installment.due_date,
          newDate: newDate.toISOString().split('T')[0]
        }
      });
      
      // 4. Refresh the installments list
      await refreshInstallments();
      
      setShowRescheduleDialog(false);
      setSelectedInstallmentId(null);
      toast.success('Payment rescheduled successfully');
    } catch (error) {
      console.error('Error rescheduling payment:', error);
      toast.error('Failed to reschedule payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    showRescheduleDialog,
    setShowRescheduleDialog,
    selectedInstallmentId,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleReschedulePayment
  };
}
