
import React, { useState, useEffect } from 'react';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useAuth } from '@/contexts/AuthContext';
import DashboardContext, { useDashboardData } from '@/contexts/DashboardContext';
import { usePayments } from '@/hooks/usePayments';
import { usePaymentStats } from '@/hooks/usePaymentStats';
import { PaymentRefundService } from '@/services/PaymentRefundService';
import { formatCurrency } from '@/utils/formatters';

export { useDashboardData } from '@/contexts/DashboardContext';

export const DashboardDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { paymentLinks, isLoading: isLoadingLinks } = usePaymentLinks();
  const { payments, setPayments, isLoadingPayments, fetchPayments } = usePayments();
  const { stats } = usePaymentStats();
  const { user } = useAuth();

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Fetch payments with payment links when paymentLinks are ready
  useEffect(() => {
    if (paymentLinks.length > 0) {
      fetchPayments(paymentLinks);
    }
  }, [paymentLinks]);

  const openRefundDialog = (paymentId: string) => {
    setPaymentToRefund(paymentId);
    setRefundDialogOpen(true);
  };

  const handleRefund = async (amount?: number) => {
    if (!paymentToRefund) return;
    
    // Show loading toast
    const loadingToastId = toast.loading('Processing refund...');
    
    try {
      setIsProcessingRefund(true);
      
      const payment = payments.find(p => p.id === paymentToRefund);
      if (!payment) throw new Error('Payment not found');
      
      const refundAmount = amount || payment.amount; // Use provided amount or default to full payment
      // Determine if this is a full refund with epsilon for floating point comparison
      const epsilon = 0.001;
      const isFullRefund = Math.abs(payment.amount - refundAmount) < epsilon;

      const result = await PaymentRefundService.processRefund(paymentToRefund, refundAmount);
      
      // Always dismiss the loading toast
      toast.dismiss(loadingToastId);
      
      if (!result.success) {
        throw new Error(result.error || 'Refund processing failed');
      }
      
      // Update the payments state with the new status and refund info
      setPayments(PaymentRefundService.getUpdatedPaymentAfterRefund(
        payments, 
        paymentToRefund, 
        refundAmount
      ));
      
      // Show success toast
      toast.success(
        isFullRefund 
          ? 'Payment refunded successfully' 
          : `Partial refund of ${formatCurrency(refundAmount)} processed successfully`
      );
      
      // Reset UI state
      setRefundDialogOpen(false);
      setDetailDialogOpen(false);
      setPaymentToRefund(null);
      
    } catch (error: any) {
      // Always dismiss the loading toast
      toast.dismiss(loadingToastId);
      
      console.error('Error refunding payment:', error);
      toast.error(`Failed to refund payment: ${error.message}`);
    } finally {
      // Always reset the processing state to prevent UI lockups
      setIsProcessingRefund(false);
    }
  };

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const value = {
    payments,
    paymentLinks,
    stats,
    selectedPayment,
    detailDialogOpen,
    refundDialogOpen,
    paymentToRefund,
    isLoading: isLoadingLinks || isLoadingPayments,
    isProcessingRefund,
    setDetailDialogOpen,
    setRefundDialogOpen,
    handlePaymentClick,
    openRefundDialog,
    handleRefund,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
