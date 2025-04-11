
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
      toast.loading('Processing refund...');
      
      // Call the refund-payment edge function
      const { data, error } = await supabase.functions.invoke('refund-payment', {
        body: JSON.stringify({
          paymentId,
          refundAmount: amount,
          fullRefund: !amount // If no amount is provided, it's a full refund
        })
      });
      
      // Dismiss the loading toast
      toast.dismiss();
      
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Refund processing failed');
      }
      
      return { 
        success: true,
        status: data.status
      };
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      return { success: false, error: error.message };
    }
  },
  
  getUpdatedPaymentAfterRefund(payments: Payment[], paymentId: string, refundAmount: number): Payment[] {
    const isFullRefund = payments.find(p => p.id === paymentId)?.amount === refundAmount;
    const status = isFullRefund ? 'refunded' : 'partially_refunded';
    
    return payments.map(payment =>
      payment.id === paymentId
        ? { 
            ...payment, 
            status: status as any,
            refundedAmount: refundAmount
          }
        : payment
    );
  },
  
  showRefundToast(isFullRefund: boolean, refundAmount: number) {
    toast.success(
      isFullRefund 
        ? 'Payment refunded successfully' 
        : `Partial refund of ${formatCurrency(refundAmount)} processed successfully`
    );
  }
};
