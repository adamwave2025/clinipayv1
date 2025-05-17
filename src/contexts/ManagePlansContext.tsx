
import React, { createContext, useContext } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

export interface PaymentDialogData {
  paymentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  amount: number;
  isValid: boolean;
}

interface ManagePlansContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  plans: Plan[];
  allPlans: Plan[];
  isLoading: boolean;
  installments: any[];
  activities: any[];
  isLoadingActivities: boolean;
  selectedPlan: Plan | null;
  showPlanDetails: boolean;
  setShowPlanDetails: (show: boolean) => void;
  isRefreshing: boolean;
  refreshPlanState: (planId: string) => Promise<void>;
  showPaymentDetails: boolean;
  setShowPaymentDetails: (show: boolean) => void;
  paymentData: any;
  viewDetailsInstallment: PlanInstallment | null;
  paymentDialogData: PaymentDialogData | null;
  setPaymentDialogData: (data: PaymentDialogData | null) => void;
  isViewMode: boolean;
  setIsViewMode: (mode: boolean) => void;
  handleViewPlanDetails: (plan: Plan) => Promise<void>;
  handleCreatePlanClick: () => void;
  handleViewPlansClick: () => void;
  handleSendReminder: () => void;
  handleViewPaymentDetails: (installment: PlanInstallment) => void;
  handleBackToPlans: () => void;
  handleMarkAsPaid: (installmentId: string) => Promise<void>;
  handleOpenReschedule: (paymentId: string) => Promise<void>; // Updated to return Promise<void>
  handleReschedulePayment: (newDate: Date) => Promise<void>;
  handleTakePayment: (paymentId: string, installmentDetails: PlanInstallment) => void;
  preparePaymentData: (paymentId: string, installmentDetails: PlanInstallment) => boolean;
  showMarkAsPaidDialog: boolean;
  setShowMarkAsPaidDialog: (show: boolean) => void;
  confirmMarkAsPaid: () => Promise<void>;
  showTakePaymentDialog: boolean;
  setShowTakePaymentDialog: (show: boolean) => void;
  onPaymentUpdated: () => Promise<void>;
  selectedInstallment: PlanInstallment | null;
  refundDialogOpen: boolean;
  setRefundDialogOpen: (open: boolean) => void;
  paymentToRefund: string | null;
  openRefundDialog: () => void;
  processRefund: () => Promise<void>;
  showCancelDialog: boolean;
  setShowCancelDialog: (show: boolean) => void;
  handleCancelPlan: () => Promise<void>;
  handleOpenCancelDialog: () => void;
  showPauseDialog: boolean;
  setShowPauseDialog: (show: boolean) => void;
  handlePausePlan: () => Promise<void>;
  handleOpenPauseDialog: () => void;
  showResumeDialog: boolean;
  setShowResumeDialog: (show: boolean) => void;
  handleResumePlan: (resumeDate?: Date) => Promise<void>;
  handleOpenResumeDialog: () => void;
  hasSentPayments: boolean;
  showRescheduleDialog: boolean;
  setShowRescheduleDialog: (show: boolean) => void;
  handleReschedulePlan: (newStartDate: Date) => Promise<void>;
  handleOpenRescheduleDialog: () => void;
  showReschedulePaymentDialog: boolean;
  setShowReschedulePaymentDialog: (show: boolean) => void;
  maxAllowedDate?: Date;
  hasOverduePayments: boolean;
  hasPaidPayments: boolean;
  isPlanPaused: (plan: Plan | null) => boolean; // Updated to a function type
  isProcessing: boolean;
  resumeError: string | null;
  setSelectedInstallment: (installment: PlanInstallment | null) => void;
  setPaymentToRefund?: (id: string | null) => void; // Add this missing function
}

const ManagePlansContext = createContext<ManagePlansContextType | null>(null);

// Export the context hook
export const useManagePlansContext = () => {
  const context = useContext(ManagePlansContext);
  if (!context) {
    throw new Error('useManagePlansContext must be used within a ManagePlansProvider');
  }
  return context;
};

export default ManagePlansContext;
