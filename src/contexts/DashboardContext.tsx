
import React, { createContext, useContext } from 'react';
import { Payment, PaymentLink, PaymentStats } from '@/types/payment';

interface DashboardContextType {
  payments: Payment[];
  paymentLinks: PaymentLink[];
  archivedLinks: PaymentLink[];
  stats: PaymentStats;
  selectedPayment: Payment | null;
  detailDialogOpen: boolean;
  refundDialogOpen: boolean;
  paymentToRefund: string | null;
  isLoading: boolean;
  isProcessingRefund: boolean;
  isArchiveLoading: boolean;
  setDetailDialogOpen: (open: boolean) => void;
  setRefundDialogOpen: (open: boolean) => void;
  handlePaymentClick: (payment: Payment) => void;
  openRefundDialog: (paymentId: string) => void;
  handleRefund: (amount?: number, paymentId?: string) => void;
  archivePaymentLink: (linkId: string) => Promise<{ success: boolean; error?: string }>;
  unarchivePaymentLink: (linkId: string) => Promise<{ success: boolean; error?: string }>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboardData = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
};

export default DashboardContext;
