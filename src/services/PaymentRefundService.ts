
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Payment } from '@/types/payment';
import { formatCurrency } from '@/utils/formatters';

export const PaymentRefundService = {
  async processRefund(paymentId: string, amount?: number): Promise<{ success: boolean; status?: string; error?: string }> {
    if (!paymentId) {
      return { success: false, error: 'Payment ID is required' };
    }
    
    try {
      // Show processing toast
      toast.loading('Processing refund...');
      
      // Call the refund-payment edge function
      const { data, error } = await supabase.functions.invoke('refund-payment', {
        body: JSON.stringify({
          paymentId,
          refundAmount: amount,
          fullRefund: !amount // If no amount is provided, it's a full refund
        })
      });
      
      // Dismiss loading toast
      toast.dismiss();
      
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Refund processing failed');
      }
      
      // Show success toast
      toast.success(amount ? 'Partial refund processed successfully' : 'Full refund processed successfully');
      
      return { 
        success: true,
        status: data.status
      };
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      toast.error(`Refund failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  getUpdatedPaymentAfterRefund(payments: Payment[], paymentId: string, refundAmount: number): Payment[] {
    // Find the payment to be updated
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) {
      console.warn('Payment not found for refund update:', paymentId);
      return payments;
    }
    
    // Log values for debugging
    console.log('Refund amount:', refundAmount);
    console.log('Payment amount:', payment.amount);
    
    // Determine if this is a full refund by checking if the amounts are equal
    // Use a small epsilon to account for floating point precision issues
    const epsilon = 0.001; // Allow for tiny differences due to floating point
    const isFullRefund = Math.abs(payment.amount - refundAmount) < epsilon;
    
    console.log('Is full refund?', isFullRefund, 'Difference:', Math.abs(payment.amount - refundAmount));
    
    // Determine status based on full or partial refund
    const status = isFullRefund ? 'refunded' : 'partially_refunded';
    
    return payments.map(p =>
      p.id === paymentId
        ? { 
            ...p, 
            status: status as any,
            refundedAmount: refundAmount
          }
        : p
    );
  }
};
