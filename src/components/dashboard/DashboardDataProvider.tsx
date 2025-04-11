
import React, { useState } from 'react';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import DashboardContext, { useDashboardData } from '@/contexts/DashboardContext';
import { usePayments } from '@/hooks/usePayments';
import { usePaymentStats } from '@/hooks/usePaymentStats';
import { PaymentRefundService } from '@/services/PaymentRefundService';

export { useDashboardData } from '@/contexts/DashboardContext';

export const DashboardDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { paymentLinks, isLoading: isLoadingLinks } = usePaymentLinks();
  const { payments, setPayments, isLoadingPayments } = usePayments();
  const { stats } = usePaymentStats();
  const { user } = useAuth();

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);

  const openRefundDialog = (paymentId: string) => {
    setPaymentToRefund(paymentId);
    setRefundDialogOpen(true);
  };

  const handleRefund = async (amount?: number) => {
    if (!paymentToRefund) return;
    
    try {
      const payment = payments.find(p => p.id === paymentToRefund);
      if (!payment) throw new Error('Payment not found');
      
      const refundAmount = amount || payment.amount; // Use provided amount or default to full payment
      const isFullRefund = refundAmount === payment.amount;

      const result = await PaymentRefundService.processRefund(paymentToRefund, refundAmount);
      
      if (!result.success) {
        throw new Error(result.error || 'Refund processing failed');
      }
      
      // Update the payments state with the new status and refund info
      setPayments(PaymentRefundService.getUpdatedPaymentAfterRefund(
        payments, 
        paymentToRefund, 
        refundAmount
      ));
      
      setRefundDialogOpen(false);
      setDetailDialogOpen(false);
      
      PaymentRefundService.showRefundToast(isFullRefund, refundAmount);
      
      setPaymentToRefund(null);
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      toast.error(`Failed to refund payment: ${error.message}`);
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
