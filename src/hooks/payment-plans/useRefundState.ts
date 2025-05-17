
import { useState } from 'react';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';
import { PaymentRefundService } from '@/services/PaymentRefundService';

export const useRefundState = () => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Modified to accept either a Payment object or a payment ID (string)
  const openRefundDialog = (paymentIdOrData: string | Payment | null) => {
    if (!paymentIdOrData) {
      console.error('No payment ID or data provided for refund');
      return;
    }

    // If it's a Payment object, extract the ID
    if (typeof paymentIdOrData === 'object') {
      setPaymentToRefund(paymentIdOrData.id);
    } else {
      // It's a string (ID)
      setPaymentToRefund(paymentIdOrData);
    }
    
    setRefundDialogOpen(true);
  };

  const handleRefund = async (amount?: number, paymentId?: string) => {
    const refundPaymentId = paymentId || paymentToRefund;
    
    if (!refundPaymentId) {
      console.error('No payment ID provided for refund');
      toast.error('Cannot process refund: Missing payment ID');
      return;
    }
    
    try {
      setIsProcessingRefund(true);
      
      const result = await PaymentRefundService.processRefund(refundPaymentId, amount);
      
      if (result.success) {
        toast.success(
          amount ? `Partial refund of ${amount} processed successfully` : 'Payment refunded successfully'
        );
        
        setRefundDialogOpen(false);
      } else {
        toast.error(`Failed to process refund: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast.error(`Error processing refund: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const processRefund = (amount?: number) => {
    handleRefund(amount, paymentToRefund || undefined);
  };

  return {
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    setPaymentToRefund,
    openRefundDialog,
    processRefund,
    handleRefund,
    isProcessingRefund
  };
};
