import React, { useState, useEffect, useCallback } from 'react';
import ManagePlansContext, { PaymentDialogData } from '@/contexts/ManagePlansContext';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { useInstallmentHandler } from '@/hooks/payment-plans/useInstallmentHandler';
import { Payment } from '@/types/payment';
import { useRefundState } from '@/hooks/payment-plans/useRefundState';
import { PlanService } from '@/services/PlanService';
import { PlanStatusService } from '@/services/PlanStatusService';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { PlanPaymentService } from '@/services/plan-operations/PlanPaymentService';
import { toast } from 'sonner';
import { useRouter } from 'next/router';

export const ManagePlansProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Plan data and state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]); // Store unfiltered plans
  const [isLoading, setIsLoading] = useState(true);
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [activities, setActivities] = useState<PlanActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  // Selected plan state
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  
  // Payment dialog data - specific for take payment operations
  const [paymentDialogData, setPaymentDialogData] = useState<PaymentDialogData | null>(null);
  
  // NEW: Plan state refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // View mode toggle state
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Add the primary selected installment state for payment actions
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  
  // Cancel plan properties
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Pause plan properties
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  
  // Resume plan properties
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  
  // Reschedule plan properties (entire plan)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  
  // Add properties for payment rescheduling (individual payment)
  const [showReschedulePaymentDialog, setShowReschedulePaymentDialog] = useState(false);
  
  // Mark as paid confirmation dialog
  const [showMarkAsPaidDialog, setShowMarkAsPaidDialog] = useState(false);
  
  // Take payment dialog
  const [showTakePaymentDialog, setShowTakePaymentDialog] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const router = useRouter();
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Ensure that the user ID is correctly retrieved from local storage
  // ===================================================================================================================
  const userId = localStorage.getItem('user_id') || '';
  
  // Use the useInstallmentHandler and useRefundState hooks for payment details and refund operations
  const {
    selectedInstallment: viewDetailsInstallment,
    setSelectedInstallment: setViewDetailsInstallment,
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    handleViewPaymentDetails,
    refundDialogOpen,
    setRefundDialogOpen,
    handleRefund,
    processRefund
  } = useInstallmentHandler();

  // Combine with useRefundState for full refund functionality if needed
  const { paymentToRefund, openRefundDialog } = useRefundState();
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Load plans only once when the component mounts
  // ===================================================================================================================
  useEffect(() => {
    if (userId) {
      loadPlans(userId);
    }
  }, [userId]);
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Load plans with proper error handling
  // ===================================================================================================================
  const loadPlans = async (userId: string) => {
    setIsLoading(true);
    try {
      const fetchedPlans = await PlanService.fetchPlans(userId);
      setPlans(fetchedPlans);
      setAllPlans(fetchedPlans); // Store unfiltered plans
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load payment plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Refresh plan state with proper error handling
  // ===================================================================================================================
  const refreshPlanState = async (planId: string) => {
    setIsRefreshing(true);
    try {
      // Fetch the updated plan
      const updatedPlan = await PlanService.fetchPlanById(planId);
      
      if (updatedPlan) {
        // Update the plans array with the new plan
        setPlans(prevPlans =>
          prevPlans.map(plan => (plan.id === planId ? updatedPlan : plan))
        );
        
        // Update the selected plan if it's the one being refreshed
        if (selectedPlan && selectedPlan.id === planId) {
          setSelectedPlan(updatedPlan);
        }
        
        toast.success('Plan details updated successfully!');
      } else {
        toast.error('Failed to refresh plan details.');
      }
    } catch (error) {
      console.error('Error refreshing plan state:', error);
      toast.error('Failed to refresh plan details. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Filter plans based on search query and status filter
  // ===================================================================================================================
  useEffect(() => {
    const filteredPlans = allPlans.filter(plan => {
      const searchRegex = new RegExp(searchQuery, 'i');
      const matchesSearch = searchRegex.test(plan.title) || searchRegex.test(plan.patientName);
      
      const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setPlans(filteredPlans);
  }, [searchQuery, statusFilter, allPlans]);
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle view plan details with proper error handling
  // ===================================================================================================================
  const handleViewPlanDetails = async (plan: Plan) => {
    try {
      setIsLoadingActivities(true);
      setSelectedPlan(plan);
      setShowPlanDetails(true);
      
      // Fetch installments and activities in parallel
      const [installmentsData, activitiesData] = await Promise.all([
        PlanService.fetchInstallments(plan.id),
        PlanService.fetchActivities(plan.id)
      ]);
      
      setInstallments(installmentsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching plan details:', error);
      toast.error('Failed to load plan details. Please try again.');
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle back to plans
  // ===================================================================================================================
  const handleBackToPlans = () => {
    setShowPlanDetails(false);
    setSelectedPlan(null);
    setInstallments([]);
    setActivities([]);
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle create plan click
  // ===================================================================================================================
  const handleCreatePlanClick = () => {
    router.push('/dashboard/create-plan');
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle view plans click
  // ===================================================================================================================
  const handleViewPlansClick = () => {
    router.push('/dashboard/manage-plans');
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle send reminder
  // ===================================================================================================================
  const handleSendReminder = async (installmentId: string) => {
    try {
      setIsProcessing(true);
      // Use PlanOperationsService for consistent API
      const result = await PlanOperationsService.sendPaymentReminder(installmentId);
      
      // Toast notification is handled within the service
      
    } catch (error) {
      toast.error('Failed to send payment reminder');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle mark as paid
  // ===================================================================================================================
  const handleMarkAsPaid = (paymentId: string) => {
    // Find the selected installment
    const installment = installments.find(inst => inst.id === paymentId);
    
    if (installment) {
      setSelectedInstallment(installment);
      setShowMarkAsPaidDialog(true);
    } else {
      toast.error('Installment not found');
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle open reschedule
  // ===================================================================================================================
  const handleOpenReschedule = (paymentId: string) => {
    // Find the selected installment
    const installment = installments.find(inst => inst.id === paymentId);
    
    if (installment) {
      setSelectedInstallment(installment);
      setShowReschedulePaymentDialog(true);
    } else {
      toast.error('Installment not found');
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle reschedule payment
  // ===================================================================================================================
  const handleReschedulePayment = async (date: Date) => {
    if (!selectedInstallment) {
      toast.error('No installment selected');
      return;
    }
    
    try {
      setIsProcessing(true);
      const result = await PlanPaymentService.reschedulePayment(selectedInstallment.id, date);
      
      if (result.success) {
        toast.success('Payment successfully rescheduled');
        setShowReschedulePaymentDialog(false);
        await refreshPlanState(selectedPlan.id);
      } else {
        toast.error('Failed to reschedule payment');
      }
    } catch (error) {
      console.error('Error rescheduling payment:', error);
      toast.error('Failed to reschedule payment');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle take payment
  // ===================================================================================================================
  const handleTakePayment = (paymentId: string, installmentDetails?: PlanInstallment) => {
    // Find the selected installment
    const installment = installments.find(inst => inst.id === paymentId);
    
    if (installment) {
      setSelectedInstallment(installment);
      
      // Prepare payment data for the dialog
      const isValid = preparePaymentData(paymentId, installment);
      
      if (isValid) {
        setShowTakePaymentDialog(true);
      } else {
        toast.error('Could not prepare payment data');
      }
    } else {
      toast.error('Installment not found');
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Confirm mark as paid
  // ===================================================================================================================
  const confirmMarkAsPaid = async () => {
    if (!selectedInstallment) {
      toast.error('No installment selected');
      return;
    }
    
    try {
      setIsProcessing(true);
      const result = await PlanPaymentService.recordManualPayment(selectedInstallment.id);
      
      if (result.success) {
        toast.success('Payment marked as paid successfully');
        setShowMarkAsPaidDialog(false);
        await refreshPlanState(selectedPlan.id);
      } else {
        toast.error('Failed to mark payment as paid');
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error('Failed to mark payment as paid');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Prepare payment data
  // ===================================================================================================================
  const preparePaymentData = (paymentId: string, installmentDetails: PlanInstallment): boolean => {
    // Find the selected installment
    const installment = installments.find(inst => inst.id === paymentId);
    
    if (!installment) {
      toast.error('Installment not found');
      return false;
    }
    
    // Prepare payment data for the dialog
    const paymentData: PaymentDialogData = {
      paymentId: installment.id,
      patientName: selectedPlan.patientName,
      patientEmail: selectedPlan.patientEmail,
      patientPhone: selectedPlan.patientPhone,
      amount: installment.amount,
      isValid: true
    };
    
    setPaymentDialogData(paymentData);
    return true;
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - On payment updated
  // ===================================================================================================================
  const onPaymentUpdated = async () => {
    setShowTakePaymentDialog(false);
    await refreshPlanState(selectedPlan.id);
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle cancel plan
  // ===================================================================================================================
  const handleCancelPlan = async () => {
    if (!selectedPlan) {
      toast.error('No plan selected');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Get the plan details first to provide to PlanOperationsService
      const plan = await PlanService.fetchPlanById(selectedPlan.id);
      if (!plan) {
        toast.error('Failed to get plan details');
        return;
      }
      
      // Use PlanOperationsService for consistent API
      const success = await PlanOperationsService.cancelPlan(plan);
      
      if (success) {
        toast.success('Payment plan cancelled successfully');
        setShowCancelDialog(false);
        await loadPlans(userId);
        handleBackToPlans();
      } else {
        toast.error('Failed to cancel payment plan');
      }
    } catch (error) {
      console.error('Error cancelling plan:', error);
      toast.error('Failed to cancel payment plan');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle open cancel dialog
  // ===================================================================================================================
  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle pause plan
  // ===================================================================================================================
  const handlePausePlan = async () => {
    if (!selectedPlan) {
      toast.error('No plan selected');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Get the plan details first to provide to PlanOperationsService
      const plan = await PlanService.fetchPlanById(selectedPlan.id);
      if (!plan) {
        toast.error('Failed to get plan details');
        return;
      }
      
      // Use PlanOperationsService for consistent API
      const success = await PlanOperationsService.pausePlan(plan);
      
      if (success) {
        toast.success('Payment plan paused successfully');
        setShowPauseDialog(false);
        await loadPlans(userId);
        handleBackToPlans();
      } else {
        toast.error('Failed to pause payment plan');
      }
    } catch (error) {
      console.error('Error pausing plan:', error);
      toast.error('Failed to pause payment plan');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle open pause dialog
  // ===================================================================================================================
  const handleOpenPauseDialog = () => {
    setShowPauseDialog(true);
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle resume plan
  // ===================================================================================================================
  const handleResumePlan = async (resumeDate: Date) => {
    if (!selectedPlan) {
      toast.error('No plan selected');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Get the plan details first to provide to PlanOperationsService
      const plan = await PlanService.fetchPlanById(selectedPlan.id);
      if (!plan) {
        toast.error('Failed to get plan details');
        return;
      }
      
      // Use PlanOperationsService for consistent API
      const success = await PlanOperationsService.resumePlan(plan, resumeDate);
      
      if (success) {
        toast.success('Payment plan resumed successfully');
        setShowResumeDialog(false);
        await loadPlans(userId);
        handleBackToPlans();
      } else {
        toast.error('Failed to resume payment plan');
      }
    } catch (error) {
      console.error('Error resuming plan:', error);
      toast.error('Failed to resume payment plan');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle open resume dialog
  // ===================================================================================================================
  const handleOpenResumeDialog = () => {
    setShowResumeDialog(true);
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle reschedule plan (entire plan)
  // ===================================================================================================================
  const handleReschedulePlan = async (newStartDate: Date) => {
    if (!selectedPlan) {
      toast.error('No plan selected');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Get the plan details first to provide to PlanOperationsService
      const plan = await PlanService.fetchPlanById(selectedPlan.id);
      if (!plan) {
        toast.error('Failed to get plan details');
        return;
      }
      
      // Use PlanOperationsService for consistent API
      const success = await PlanOperationsService.reschedulePlan(plan, newStartDate);
      
      if (success) {
        toast.success('Payment plan rescheduled successfully');
        setShowRescheduleDialog(false);
        await loadPlans(userId);
        handleBackToPlans();
      } else {
        toast.error('Failed to reschedule payment plan');
      }
    } catch (error) {
      console.error('Error rescheduling plan:', error);
      toast.error('Failed to reschedule payment plan');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Handle open reschedule dialog (entire plan)
  // ===================================================================================================================
  const handleOpenRescheduleDialog = () => {
    setShowRescheduleDialog(true);
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Plan state helpers
  // ===================================================================================================================
  const isPlanPaused = (plan: Plan | null): boolean => {
    return PlanStatusService.isPlanPaused(plan);
  };
  
  // ===================================================================================================================
  // IMPORTANT: FIX - Plan properties
  // ===================================================================================================================
  const hasSentPayments = selectedPlan ? PlanStatusService.hasSentPayments(selectedPlan, installments) : false;
  const hasOverduePayments = selectedPlan ? PlanStatusService.hasOverduePayments(selectedPlan, installments) : false;
  const hasPaidPayments = selectedPlan ? PlanStatusService.hasPaidPayments(selectedPlan, installments) : false;

  return (
    <ManagePlansContext.Provider value={{
      // Search and filter state
      searchQuery,
      setSearchQuery,
      statusFilter,
      setStatusFilter,
      
      // Plan data and state
      plans,
      allPlans,
      isLoading,
      installments,
      activities,
      isLoadingActivities,
      
      // Selected plan state
      selectedPlan,
      showPlanDetails,
      setShowPlanDetails,
      
      // Payment details handling
      showPaymentDetails,
      setShowPaymentDetails,
      paymentData,
      viewDetailsInstallment,
      
      // Payment dialog data - specific for take payment operations
      paymentDialogData,
      setPaymentDialogData,
      preparePaymentData,
      
      // NEW: Plan state refresh
      isRefreshing,
      refreshPlanState,
      
      // View mode toggle state
      isViewMode,
      setIsViewMode,
      
      // Action handlers
      handleViewPlanDetails,
      handleCreatePlanClick,
      handleViewPlansClick,
      handleSendReminder,
      handleViewPaymentDetails,
      handleBackToPlans,
      
      // Add the missing handler methods
      handleMarkAsPaid,
      handleOpenReschedule,
      handleReschedulePayment,
      handleTakePayment,
      
      // Mark as paid confirmation dialog
      showMarkAsPaidDialog,
      setShowMarkAsPaidDialog,
      confirmMarkAsPaid,
      
      // Take payment dialog
      showTakePaymentDialog,
      setShowTakePaymentDialog,
      onPaymentUpdated,
      
      // Refund functionality
      refundDialogOpen,
      setRefundDialogOpen,
      paymentToRefund,
      openRefundDialog,
      processRefund,
      handleRefund,
      
      // Cancel plan properties
      showCancelDialog,
      setShowCancelDialog,
      handleCancelPlan,
      handleOpenCancelDialog,
      
      // Pause plan properties
      showPauseDialog,
      setShowPauseDialog,
      handlePausePlan,
      handleOpenPauseDialog,
      
      // Resume plan properties
      showResumeDialog,
      setShowResumeDialog,
      handleResumePlan,
      handleOpenResumeDialog,
      hasSentPayments,
      hasOverduePayments,
      hasPaidPayments,
      resumeError,
      
      // Reschedule plan properties (entire plan)
      showRescheduleDialog,
      setShowRescheduleDialog,
      handleReschedulePlan,
      handleOpenRescheduleDialog,
      
      // Add properties for payment rescheduling (individual payment)
      showReschedulePaymentDialog,
      setShowReschedulePaymentDialog,
      
      // Plan state helpers
      isPlanPaused,
      isProcessing,
      
      // Add the primary selected installment state for payment actions
      selectedInstallment
    }}>
      {children}
    </ManagePlansContext.Provider>
  );
};

export default ManagePlansProvider;
