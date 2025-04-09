
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
  // Mock data
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      patientName: 'Sarah Johnson',
      patientEmail: 'sarah.j@example.com',
      patientPhone: '+44 7700 900123',
      amount: 75.00,
      date: '2025-04-08',
      status: 'paid',
      type: 'deposit',
    },
    {
      id: '2',
      patientName: 'Michael Brown',
      patientEmail: 'michael.b@example.com',
      patientPhone: '+44 7700 900456',
      amount: 125.00,
      date: '2025-04-07',
      status: 'paid',
      type: 'treatment',
    },
    {
      id: '3',
      patientName: 'Emily Davis',
      patientEmail: 'emily.d@example.com',
      patientPhone: '+44 7700 900789',
      amount: 50.00,
      date: '2025-04-07',
      status: 'refunded',
      type: 'consultation',
    },
    {
      id: '4',
      patientName: 'James Wilson',
      patientEmail: 'james.w@example.com',
      patientPhone: '+44 7700 900246',
      amount: 100.00,
      date: '2025-04-06',
      status: 'pending',
      type: 'deposit',
    },
    {
      id: '5',
      patientName: 'Jennifer Lee',
      patientEmail: 'jennifer.l@example.com',
      patientPhone: '+44 7700 900135',
      amount: 85.00,
      date: '2025-04-05',
      status: 'failed',
      type: 'treatment',
    },
  ]);

  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([
    {
      id: '1',
      title: 'Consultation Deposit',
      amount: 50.00,
      type: 'deposit',
      url: 'https://clinipay.com/pay/abc123',
      createdAt: '2025-04-08',
    },
    {
      id: '2',
      title: 'Full Treatment Package',
      amount: 250.00,
      type: 'treatment',
      url: 'https://clinipay.com/pay/def456',
      createdAt: '2025-04-06',
    },
    {
      id: '3',
      title: 'Follow-up Consultation',
      amount: 75.00,
      type: 'consultation',
      url: 'https://clinipay.com/pay/ghi789',
      createdAt: '2025-04-02',
    },
  ]);

  const stats: PaymentStats = {
    totalReceivedToday: 200.00,
    totalPendingToday: 100.00,
    totalReceivedMonth: 1875.50,
    totalRefundedMonth: 225.00,
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
