
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
import { PlanActivity } from '@/utils/planActivityUtils';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { formatPlanInstallments } from '@/utils/paymentPlanUtils';
import { formatPlanActivities } from '@/utils/planActivityUtils';

export const usePlanQuickAccess = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planInstallments, setPlanInstallments] = useState<PlanInstallment[]>([]);
  const [planActivities, setPlanActivities] = useState<PlanActivity[]>([]);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleViewPlanDetails = async (plan: Plan) => {
    setSelectedPlan(plan);
    
    // Fetch installments and activities
    await fetchPlanDetails(plan);
    
    setShowPlanDetails(true);
  };
  
  const fetchPlanDetails = async (plan: Plan) => {
    // First fetch installments
    await fetchPlanInstallments(plan);
    
    // Then fetch activities
    await fetchPlanActivities(plan);
  };
  
  const fetchPlanInstallments = async (plan: Plan) => {
    setIsLoadingInstallments(true);
    try {
      // Get all payment schedules for this plan
      const { data, error } = await supabase
        .from('payment_schedule')
        .select(`
          id, 
          payment_number,
          total_payments,
          due_date,
          amount,
          status,
          payment_request_id,
          plan_id
        `)
        .eq('plan_id', plan.id)
        .order('payment_number', { ascending: true });
        
      if (error) throw error;
      
      const formattedInstallments = formatPlanInstallments(data || []);
      setPlanInstallments(formattedInstallments);
      
    } catch (err) {
      console.error('Error fetching plan installments:', err);
      toast.error('Failed to load payment installments');
    } finally {
      setIsLoadingInstallments(false);
    }
  };
  
  const fetchPlanActivities = async (plan: Plan) => {
    setIsLoadingActivities(true);
    try {
      // Get all activities for this plan
      const { data, error } = await supabase
        .from('payment_plan_activities')
        .select('*')
        .eq('payment_link_id', plan.paymentLinkId)
        .order('performed_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedActivities = formatPlanActivities(data || []);
      setPlanActivities(formattedActivities);
      
    } catch (err) {
      console.error('Error fetching plan activities:', err);
      toast.error('Failed to load plan activities');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
    setShowPlanDetails(false);
  };
  
  const handleOpenPauseDialog = () => {
    setShowPauseDialog(true);
    setShowPlanDetails(false);
  };
  
  const handleOpenResumeDialog = () => {
    setShowResumeDialog(true);
    setShowPlanDetails(false);
  };
  
  const handleOpenRescheduleDialog = () => {
    setShowRescheduleDialog(true);
    setShowPlanDetails(false);
  };
  
  // Function to check if a plan is paused - now uses plan.status directly
  const isPlanPaused = (plan: Plan | null): boolean => {
    if (!plan) return false;
    return plan.status === 'paused';
  };

  const handleCancelPlan = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: 'cancelled' })
        .eq('id', selectedPlan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all pending payment schedules to cancelled
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'cancelled' })
        .eq('plan_id', selectedPlan.id)
        .in('status', ['pending', 'paused']);
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_plan_activities')
        .insert({
          payment_link_id: selectedPlan.paymentLinkId,
          patient_id: selectedPlan.patientId,
          clinic_id: selectedPlan.clinicId,
          action_type: 'cancel_plan',
          details: {
            plan_name: selectedPlan.title || selectedPlan.planName,
            previous_status: selectedPlan.status
          }
        });
      
      if (activityError) {
        console.error('Error logging cancel activity:', activityError);
      }
      
      toast.success('Payment plan cancelled successfully');
      
      // Update plan state
      if (selectedPlan) {
        setSelectedPlan({
          ...selectedPlan,
          status: 'cancelled'
        });
      }
      
    } catch (error: any) {
      console.error('Error cancelling plan:', error);
      toast.error('Failed to cancel plan: ' + error.message);
    } finally {
      setIsProcessing(false);
      setShowCancelDialog(false);
    }
  };
  
  const handlePausePlan = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: 'paused' })
        .eq('id', selectedPlan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all pending payment schedules to paused
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'paused' })
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'pending');
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_plan_activities')
        .insert({
          payment_link_id: selectedPlan.paymentLinkId,
          patient_id: selectedPlan.patientId,
          clinic_id: selectedPlan.clinicId,
          action_type: 'pause_plan',
          details: {
            plan_name: selectedPlan.title || selectedPlan.planName,
            previous_status: selectedPlan.status
          }
        });
      
      if (activityError) {
        console.error('Error logging pause activity:', activityError);
      }
      
      toast.success('Payment plan paused successfully');
      
      // Update plan state
      if (selectedPlan) {
        setSelectedPlan({
          ...selectedPlan,
          status: 'paused'
        });
      }
      
    } catch (error: any) {
      console.error('Error pausing plan:', error);
      toast.error('Failed to pause plan: ' + error.message);
    } finally {
      setIsProcessing(false);
      setShowPauseDialog(false);
    }
  };
  
  const handleResumePlan = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // Determine what the plan status should be updated to
      // If it has overdue payments, it should be 'overdue', otherwise 'active'
      const newStatus = selectedPlan.hasOverduePayments ? 'overdue' : 'active';
      
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: newStatus })
        .eq('id', selectedPlan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all paused payment schedules back to pending
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'pending' })
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused');
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_plan_activities')
        .insert({
          payment_link_id: selectedPlan.paymentLinkId,
          patient_id: selectedPlan.patientId,
          clinic_id: selectedPlan.clinicId,
          action_type: 'resume_plan',
          details: {
            plan_name: selectedPlan.title || selectedPlan.planName,
            previous_status: 'paused',
            new_status: newStatus
          }
        });
      
      if (activityError) {
        console.error('Error logging resume activity:', activityError);
      }
      
      toast.success('Payment plan resumed successfully');
      
      // Update plan state
      if (selectedPlan) {
        setSelectedPlan({
          ...selectedPlan,
          status: newStatus
        });
      }
      
    } catch (error: any) {
      console.error('Error resuming plan:', error);
      toast.error('Failed to resume plan: ' + error.message);
    } finally {
      setIsProcessing(false);
      setShowResumeDialog(false);
    }
  };
  
  const handleReschedulePlan = async () => {
    if (!selectedPlan) return;
    
    // This functionality would be more complex and would need to reschedule future payments
    // For now, just show a toast saying this would be implemented
    toast.info("Plan rescheduling is not currently implemented");
    setShowRescheduleDialog(false);
  };

  return {
    selectedPlan,
    planInstallments,
    planActivities,
    isLoadingInstallments,
    isLoadingActivities,
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
