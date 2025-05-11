
import React, { createContext, useContext } from 'react';
import { Plan } from '@/utils/planTypes';
import { Payment } from '@/types/payment';
import { PlanActivity } from '@/utils/planActivityUtils';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

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
  
  // Payment details state
  showPaymentDetails: boolean;
  setShowPaymentDetails: (show: boolean) => void;
  paymentData: Payment | null;
  selectedInstallment: any | null;
  
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
  handleOpenReschedule: (paymentId: string) => void;
  handleReschedulePayment: (date: Date) => void;
  handleTakePayment: (paymentId: string) => void;
  
  // Mark as paid confirmation dialog
  showMarkAsPaidDialog: boolean;
  setShowMarkAsPaidDialog: (show: boolean) => void;
  confirmMarkAsPaid: () => Promise<void>;
  
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
  hasPaidPayments: boolean; // Required property
  resumeError?: string | null;
  
  // Reschedule plan properties (entire plan)
  showRescheduleDialog: boolean;
  setShowRescheduleDialog: (show: boolean) => void;
  handleReschedulePlan: (newStartDate: Date) => Promise<void>;
  handleOpenRescheduleDialog: () => void;
  
  // Add properties for payment rescheduling (individual payment)
  showReschedulePaymentDialog: boolean;
  setShowReschedulePaymentDialog: (show: boolean) => void;
  
  // Plan state helpers
  isPlanPaused: (plan: Plan | null) => boolean;
  isProcessing: boolean;
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
