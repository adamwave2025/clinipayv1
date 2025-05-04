
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment, formatPlanInstallments } from '@/utils/paymentPlanUtils';
import { PlanActivity, formatPlanActivities } from '@/utils/planActivityUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  cancelPaymentPlan, 
  pausePaymentPlan,
  resumePaymentPlan,
  reschedulePaymentPlan,
  fetchPlanActivities
} from '@/services/PaymentScheduleService';

export const usePlanQuickAccess = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [planInstallments, setPlanInstallments] = useState<PlanInstallment[]>([]);
  const [planActivities, setPlanActivities] = useState<PlanActivity[]>([]);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dialog state for various actions
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  
  // Handle viewing plan details
  const handleViewPlanDetails = async (plan: Plan) => {
    setSelectedPlan(plan);
    
    try {
      setIsLoadingInstallments(true);
      setIsLoadingActivities(true);
      
      // Fetch installments for this plan
      let installments: PlanInstallment[] = [];
      
      if (plan.id.includes('_')) {
        // Legacy plan ID format: patientId_paymentLinkId
        const [patientId, paymentLinkId] = plan.id.split('_');
        
        if (!patientId || !paymentLinkId) {
          throw new Error('Invalid plan ID');
        }
        
        // Fetch installments for this plan from Supabase
        const { data: rawInstallments, error } = await supabase
          .from('payment_schedule')
          .select(`
            id,
            amount,
            due_date,
            payment_number,
            total_payments,
            status,
            payment_request_id,
            payment_requests (
              id,
              payment_id,
              paid_at,
              status
            )
          `)
          .eq('patient_id', patientId)
          .eq('payment_link_id', paymentLinkId)
          .order('payment_number', { ascending: true });
          
        if (error) throw error;
        
        // Format installments for display
        installments = formatPlanInstallments(rawInstallments || []);
      } else {
        // Modern plan ID format: direct UUID
        const { data: rawInstallments, error } = await supabase
          .from('payment_schedule')
          .select(`
            id,
            amount,
            due_date,
            payment_number,
            total_payments,
            status,
            payment_request_id,
            payment_requests (
              id,
              payment_id,
              paid_at,
              status
            )
          `)
          .eq('plan_id', plan.id)
          .order('payment_number', { ascending: true });
          
        if (error) throw error;
        
        // Format installments for display
        installments = formatPlanInstallments(rawInstallments || []);
      }
      
      setPlanInstallments(installments);
      
      // Fetch plan activities
      const activities = await fetchPlanActivities(plan.id);
      setPlanActivities(formatPlanActivities(activities));
      
      // Show the plan details drawer
      setShowPlanDetails(true);
    } catch (err) {
      console.error('Error fetching plan details:', err);
      toast.error('Could not load plan details');
    } finally {
      setIsLoadingInstallments(false);
      setIsLoadingActivities(false);
    }
  };
  
  // Helper to check if a plan is paused
  const isPlanPaused = (plan: Plan | null) => {
    if (!plan) return false;
    return plan.status === 'paused';
  };
  
  // Handle plan actions
  const handleOpenCancelDialog = () => setShowCancelDialog(true);
  const handleOpenPauseDialog = () => setShowPauseDialog(true);
  const handleOpenResumeDialog = () => setShowResumeDialog(true);
  const handleOpenRescheduleDialog = () => setShowRescheduleDialog(true);
  
  const handleCancelPlan = async () => {
    if (!selectedPlan) return;
    
    try {
      setIsProcessing(true);
      const result = await cancelPaymentPlan(selectedPlan.id);
      
      if (result.success) {
        toast.success('Payment plan cancelled successfully');
        setShowCancelDialog(false);
        setShowPlanDetails(false);
        return true;
      } else {
        toast.error('Failed to cancel payment plan');
        return false;
      }
    } catch (error) {
      console.error('Error cancelling plan:', error);
      toast.error('Failed to cancel payment plan');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePausePlan = async () => {
    if (!selectedPlan) return;
    
    try {
      setIsProcessing(true);
      const result = await pausePaymentPlan(selectedPlan.id);
      
      if (result.success) {
        toast.success('Payment plan paused successfully');
        setShowPauseDialog(false);
        setShowPlanDetails(false);
        return true;
      } else {
        toast.error('Failed to pause payment plan');
        return false;
      }
    } catch (error) {
      console.error('Error pausing plan:', error);
      toast.error('Failed to pause payment plan');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleResumePlan = async (resumeDate: Date) => {
    if (!selectedPlan) return;
    
    try {
      setIsProcessing(true);
      const result = await resumePaymentPlan(selectedPlan.id, resumeDate);
      
      if (result.success) {
        toast.success('Payment plan resumed successfully');
        setShowResumeDialog(false);
        setShowPlanDetails(false);
        return true;
      } else {
        toast.error('Failed to resume payment plan');
        return false;
      }
    } catch (error) {
      console.error('Error resuming plan:', error);
      toast.error('Failed to resume payment plan');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReschedulePlan = async (newStartDate: Date) => {
    if (!selectedPlan) return;
    
    try {
      setIsProcessing(true);
      const result = await reschedulePaymentPlan(selectedPlan.id, newStartDate);
      
      if (result.success) {
        toast.success('Payment plan rescheduled successfully');
        setShowRescheduleDialog(false);
        setShowPlanDetails(false);
        return true;
      } else {
        toast.error('Failed to reschedule payment plan');
        return false;
      }
    } catch (error) {
      console.error('Error rescheduling plan:', error);
      toast.error('Failed to reschedule payment plan');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    // Plan data
    selectedPlan,
    planInstallments,
    planActivities,
    isLoadingInstallments,
    isLoadingActivities,
    
    // Dialog state
    showPlanDetails,
    setShowPlanDetails,
    showCancelDialog,
    setShowCancelDialog,
    showPauseDialog,
    setShowPauseDialog,
    showResumeDialog,
    setShowResumeDialog,
    showRescheduleDialog,
    setShowRescheduleDialog,
    
    // Actions
    handleViewPlanDetails,
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
    handleOpenRescheduleDialog,
    handleCancelPlan,
    handlePausePlan,
    handleResumePlan,
    handleReschedulePlan,
    isPlanPaused,
    isProcessing
  };
};
