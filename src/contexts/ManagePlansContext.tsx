
import React, { createContext, useContext } from 'react';
import { Plan } from '@/utils/planTypes';
import { Payment } from '@/types/payment';
import { PlanActivity } from '@/utils/planActivityUtils';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

// Create a dedicated type for payment dialog data
export interface PaymentDialogData {
  paymentId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  isValid: boolean;
}

export interface ManagePlansContextType {
  // Search and filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  
  // Plan data and state
  plans: Plan[];
  allPlans: Plan[]; // Add allPlans to expose unfiltered plans
  isLoading: boolean;
  installments: any[];
  activities: PlanActivity[];
  isLoadingActivities: boolean;
  
  // Selected plan state
  selectedPlan: Plan | null;
  showPlanDetails: boolean;
  setShowPlanDetails: (show: boolean) => void;
  
  // Payment details state - RENAMED to viewDetailsInstallment to avoid conflict
  showPaymentDetails: boolean;
  setShowPaymentDetails: (show: boolean) => void;
  paymentData: Payment | null;
  setPaymentData: (data: Payment | null) => void; // Add setter for payment data
  viewDetailsInstallment: PlanInstallment | null; // Renamed from selectedInstallment
  
  // Payment dialog data - specific for take payment operations
  paymentDialogData: PaymentDialogData | null;
  setPaymentDialogData: (data: PaymentDialogData | null) => void;
  preparePaymentData: (paymentId: string, installmentDetails: PlanInstallment) => boolean; 
  
  // NEW: Plan state refresh
  isRefreshing: boolean;
  refreshPlanState: (planId: string) => Promise<void>;
  
  // View mode toggle state
  isViewMode: boolean;
  setIsViewMode: (isViewMode: boolean) => void;
  
  // Action handlers
  handleViewPlanDetails: (plan: Plan) => Promise<void>;
  handleCreatePlanClick: () => void;
  handleViewPlansClick: () => void;
  handleSendReminder: (installmentId: string) => Promise<void>;
  handleViewPaymentDetails: (installment: any) => Promise<void>;
  handleBackToPlans: () => void;
  
  // Add the missing handler methods
  handleMarkAsPaid: (paymentId: string) => void;
  // Modified function for reschedule handling - supports both plan and payment rescheduling
  handleOpenRescheduleDialog: (paymentId?: string) => void;
  handleReschedulePayment: (date: Date) => void;
  handleTakePayment: (paymentId: string, installmentDetails?: any) => void;
  
  // Mark as paid confirmation dialog
  showMarkAsPaidDialog: boolean;
  setShowMarkAsPaidDialog: (show: boolean) => void;
  confirmMarkAsPaid: () => Promise<void>;
  
  // Take payment dialog
  showTakePaymentDialog: boolean;
  setShowTakePaymentDialog: (show: boolean) => void;
  onPaymentUpdated: () => Promise<void>;
  
  // Refund properties
  refundDialogOpen: boolean;
  setRefundDialogOpen: (open: boolean) => void;
  paymentToRefund: string | null;
  openRefundDialog: () => void;
  processRefund: (amount?: number) => void;
  
  // Cancel plan properties
  showCancelDialog: boolean;
  setShowCancelDialog: (show: boolean) => void;
  handleCancelPlan: () => Promise<void>;
  handleOpenCancelDialog: () => void;
  
  // Pause plan properties
  showPauseDialog: boolean;
  setShowPauseDialog: (show: boolean) => void;
  handlePausePlan: () => Promise<void>;
  handleOpenPauseDialog: () => void;
  
  // Resume plan properties
  showResumeDialog: boolean;
  setShowResumeDialog: (show: boolean) => void;
  handleResumePlan: (resumeDate: Date) => Promise<void>;
  handleOpenResumeDialog: () => void;
  hasSentPayments: boolean;
  hasOverduePayments: boolean;
  hasPaidPayments: boolean;
  resumeError?: string | null;
  
  // Reschedule payment dialog properties
  showReschedulePaymentDialog: boolean; 
  setShowReschedulePaymentDialog: (show: boolean) => void;
  
  // Reschedule plan dialog properties - adding these properties
  showRescheduleDialog: boolean;
  setShowRescheduleDialog: (show: boolean) => void;
  handleReschedulePlan: (newStartDate: Date) => Promise<void>;
  
  // Plan state helpers
  isPlanPaused: (plan: Plan | null) => boolean;
  isProcessing: boolean;
  
  // Add the primary selected installment state for payment actions
  selectedInstallment: PlanInstallment | null;
}

const ManagePlansContext = createContext<ManagePlansContextType | undefined>(undefined);

export const useManagePlansContext = () => {
  const context = useContext(ManagePlansContext);
  if (!context) {
    throw new Error('useManagePlansContext must be used within a ManagePlansProvider');
  }
  return context;
};

export default ManagePlansContext;
