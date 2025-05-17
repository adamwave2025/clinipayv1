
import { createContext, useContext } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { PlanActivity } from '@/utils/planActivityUtils';
import { Payment } from '@/types/payment';

// Define the type for payment dialog data
export interface PaymentDialogData {
  paymentId: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  isValid: boolean;
}

interface ManagePlansContextType {
  // Search and filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  
  // Data
  plans: Plan[];
  allPlans: Plan[];
  isLoading: boolean;
  installments: PlanInstallment[];
  activities: PlanActivity[];
  isLoadingActivities: boolean;
  
  // Selected plan
  selectedPlan: Plan | null;
  showPlanDetails: boolean;
  setShowPlanDetails: (show: boolean) => void;
  
  // Refresh state
  isRefreshing: boolean;
  refreshPlanState: (planId: string) => Promise<void>;
  
  // Payment details
  showPaymentDetails: boolean;
  setShowPaymentDetails: (show: boolean) => void;
  paymentData: Payment | null;
  viewDetailsInstallment: PlanInstallment | null;
  
  // Payment dialog data
  paymentDialogData: PaymentDialogData | null;
  setPaymentDialogData: (data: PaymentDialogData | null) => void;
  
  // View mode
  isViewMode: boolean;
  setIsViewMode: (isView: boolean) => void;
  
  // Action handlers
  handleViewPlanDetails: (plan: Plan) => void;
  handleCreatePlanClick: () => void;
  handleViewPlansClick: () => void;
  handleSendReminder: (planId: string) => void;
  handleViewPaymentDetails: (installment: PlanInstallment) => void;
  handleBackToPlans: () => void;
  
  // Individual payment actions
  handleMarkAsPaid: (paymentId: string, installment: PlanInstallment) => void;
  handleOpenReschedule: (paymentId: string) => void;
  handleReschedulePayment: (newDate: Date) => Promise<void>;
  handleTakePayment: (paymentId: string, installment: PlanInstallment) => void;
  preparePaymentData: (paymentId: string, installmentDetails: PlanInstallment) => boolean;
  
  // Mark as Paid dialog properties
  showMarkAsPaidDialog: boolean;
  setShowMarkAsPaidDialog: (show: boolean) => void;
  confirmMarkAsPaid: () => Promise<void>;
  
  // Take Payment dialog properties
  showTakePaymentDialog: boolean;
  setShowTakePaymentDialog: (show: boolean) => void;
  onPaymentUpdated: () => Promise<void>;
  selectedInstallment: PlanInstallment | null;
  
  // Refund properties
  refundDialogOpen: boolean;
  setRefundDialogOpen: (open: boolean) => void;
  paymentToRefund: string | null;
  openRefundDialog: (payment: Payment | null) => void;
  processRefund: (amount?: number, paymentId?: string) => void;
  
  // Plan action dialogs and handlers
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
  handleResumePlan: () => Promise<void>;
  handleOpenResumeDialog: () => void;
  hasSentPayments: boolean;
  
  showRescheduleDialog: boolean;
  setShowRescheduleDialog: (show: boolean) => void;
  handleReschedulePlan: (newStartDate: Date) => Promise<void>;
  handleOpenRescheduleDialog: () => void;
  
  // Payment rescheduling dialog properties
  showReschedulePaymentDialog: boolean;
  setShowReschedulePaymentDialog: (show: boolean) => void;
  
  // Plan state helpers
  hasOverduePayments: boolean;
  hasPaidPayments: boolean;
  isPlanPaused: (plan: Plan | null) => boolean;
  isProcessing: boolean;
  resumeError: string | null;
}

const ManagePlansContext = createContext<ManagePlansContextType | undefined>(undefined);

export const useManagePlansContext = () => {
  const context = useContext(ManagePlansContext);
  if (context === undefined) {
    throw new Error("useManagePlansContext must be used within a ManagePlansProvider");
  }
  return context;
};

export default ManagePlansContext;
