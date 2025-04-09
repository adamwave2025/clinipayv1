
import React, { createContext, useContext, useState } from 'react';
import { Payment, PaymentLink, PaymentStats } from '@/types/payment';
import { toast } from 'sonner';

interface DashboardContextType {
  payments: Payment[];
  paymentLinks: PaymentLink[];
  stats: PaymentStats;
  selectedPayment: Payment | null;
  detailDialogOpen: boolean;
  refundDialogOpen: boolean;
  paymentToRefund: string | null;
  setDetailDialogOpen: (open: boolean) => void;
  setRefundDialogOpen: (open: boolean) => void;
  handlePaymentClick: (payment: Payment) => void;
  openRefundDialog: (paymentId: string) => void;
  handleRefund: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboardData = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
};

export const DashboardDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Empty initial data
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);

  const stats: PaymentStats = {
    totalReceivedToday: 0,
    totalPendingToday: 0,
    totalReceivedMonth: 0,
    totalRefundedMonth: 0,
  };

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);

  const openRefundDialog = (paymentId: string) => {
    setPaymentToRefund(paymentId);
    setRefundDialogOpen(true);
  };

  const handleRefund = () => {
    if (!paymentToRefund) return;
    
    // Mock refund process
    setPayments(prevPayments =>
      prevPayments.map(payment =>
        payment.id === paymentToRefund
          ? { ...payment, status: 'refunded' as const }
          : payment
      )
    );
    
    // Close both dialogs
    setRefundDialogOpen(false);
    setDetailDialogOpen(false);
    
    toast.success('Payment refunded successfully');
    setPaymentToRefund(null);
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
