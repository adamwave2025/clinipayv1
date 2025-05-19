
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const useInstallmentPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to mark an installment as paid
  const markAsPaid = async (paymentId: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // 1. Get the payment schedule entry
      const { data: scheduleEntry, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('id, plan_id, status, payment_number, total_payments')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) {
        throw new Error(`Error fetching payment details: ${fetchError.message}`);
      }
      
      // Validate that the payment is in a status that can be marked as paid
      const validStatuses = ['pending', 'overdue', 'paused'];
      if (!validStatuses.includes(scheduleEntry.status)) {
        throw new Error(`Payment cannot be marked as paid because its status is ${scheduleEntry.status}`);
      }
      
      // 2. Update the status to 'paid'
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (updateError) {
        throw new Error(`Error updating payment status: ${updateError.message}`);
      }
      
      // 3. Update the plan progress
      if (scheduleEntry.plan_id) {
        // MODIFIED: Count installments with paid, refunded or partially_refunded status as "paid"
        const { count: paidInstallments, error: countError } = await supabase
          .from('payment_schedule')
          .select('id', { count: 'exact', head: true })
          .eq('plan_id', scheduleEntry.plan_id)
          .in('status', ['paid', 'refunded', 'partially_refunded']);
        
        if (countError) {
          throw new Error(`Error counting paid installments: ${countError.message}`);
        }
        
        // Get the plan details
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('total_installments')
          .eq('id', scheduleEntry.plan_id)
          .single();
        
        if (planError) {
          throw new Error(`Error fetching plan details: ${planError.message}`);
        }
        
        // Calculate progress percentage
        const progress = Math.round((paidInstallments / planData.total_installments) * 100);
        
        // Determine new plan status
        let newStatus = 'active';
        if (paidInstallments >= planData.total_installments) {
          newStatus = 'completed';
        }
        
        // Update the plan
        const { error: planUpdateError } = await supabase
          .from('plans')
          .update({
            paid_installments: paidInstallments,
            progress: progress,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', scheduleEntry.plan_id);
        
        if (planUpdateError) {
          throw new Error(`Error updating plan progress: ${planUpdateError.message}`);
        }
      }
      
      toast.success('Payment marked as paid successfully');
      return { success: true };
      
    } catch (err: any) {
      console.error('Error marking payment as paid:', err);
      setError(err.message || 'An error occurred while marking payment as paid');
      toast.error(err.message || 'Failed to mark payment as paid');
      return { success: false, error: err.message };
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    markAsPaid,
    isProcessing,
    error
  };
};
