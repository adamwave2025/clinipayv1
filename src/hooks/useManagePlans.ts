import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  fetchUserClinicId, 
  fetchPaymentSchedules,
  fetchPlanInstallments,
  cancelPaymentPlan 
} from '@/services/PaymentScheduleService';
import { 
  groupPaymentSchedulesByPlan,
  formatPlanInstallments,
  type Plan,
  type PlanInstallment
} from '@/utils/paymentPlanUtils';
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types/payment';

export const useManagePlans = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentData, setPaymentData] = useState<Payment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch payment plans on mount
  useEffect(() => {
    if (user) {
      fetchPaymentPlans();
    }
  }, [user]);

  // Filter plans when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) return;
    
    const filtered = plans.filter(plan => 
      plan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.planName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setPlans(prev => filtered.length > 0 ? filtered : prev);
  }, [searchQuery]);

  const fetchPaymentPlans = async () => {
    setIsLoading(true);
    try {
      // Get user's clinic_id
      const clinicId = await fetchUserClinicId(user.id);
      if (!clinicId) {
        setIsLoading(false);
        return;
      }

      // Fetch payment schedule data
      const scheduleData = await fetchPaymentSchedules(clinicId);
      
      // Process data to group by patient_id and payment_link_id
      const plansMap = groupPaymentSchedulesByPlan(scheduleData);
      
      setPlans(Array.from(plansMap.values()));
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast.error('Failed to load payment plans');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPlanInstallmentsData = async (planId: string) => {
    try {
      const [patientId, paymentLinkId] = planId.split('_');
      
      if (!patientId || !paymentLinkId) {
        throw new Error('Invalid plan ID');
      }
      
      // Fetch installments for this plan
      const rawInstallments = await fetchPlanInstallments(patientId, paymentLinkId);
      
      // Format installments for display
      const formattedInstallments = formatPlanInstallments(rawInstallments);
      
      setInstallments(formattedInstallments);
      return formattedInstallments;
    } catch (error) {
      console.error('Error fetching plan installments:', error);
      toast.error('Failed to load payment details');
      return [];
    }
  };

  const handleViewPlanDetails = async (plan: Plan) => {
    setSelectedPlan(plan);
    await fetchPlanInstallmentsData(plan.id);
    setShowPlanDetails(true);
  };

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  const handleViewPlansClick = () => {
    navigate('/dashboard/payment-plans');
  };
  
  const handleSendReminder = async (installmentId: string) => {
    // Implementation for sending payment reminder
    toast.info('Reminder functionality will be implemented soon');
  };

  const fetchPaymentDataForInstallment = async (installment: PlanInstallment) => {
    try {
      if (!installment.paymentRequestId) {
        toast.error('No payment information available');
        return null;
      }

      // First get the payment_id from the payment request
      const { data: requestData, error: requestError } = await supabase
        .from('payment_requests')
        .select('payment_id')
        .eq('id', installment.paymentRequestId)
        .single();

      if (requestError || !requestData.payment_id) {
        console.error('Error fetching payment request:', requestError);
        toast.error('Failed to fetch payment information');
        return null;
      }

      // Now fetch the actual payment data
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select(`
          id,
          amount_paid,
          paid_at,
          patient_name,
          patient_email,
          patient_phone,
          payment_ref,
          status,
          payment_link_id,
          payment_links (
            title,
            type,
            description
          )
        `)
        .eq('id', requestData.payment_id)
        .single();

      if (paymentError) {
        console.error('Error fetching payment data:', paymentError);
        toast.error('Failed to fetch payment details');
        return null;
      }

      // Format the payment data
      const formattedPayment: Payment = {
        id: paymentData.id,
        patientName: paymentData.patient_name || 'Unknown',
        patientEmail: paymentData.patient_email,
        patientPhone: paymentData.patient_phone,
        amount: paymentData.amount_paid || 0,
        date: new Date(paymentData.paid_at).toLocaleDateString(),
        status: paymentData.status as any || 'paid',
        type: 'payment_plan',
        reference: paymentData.payment_ref,
        linkTitle: paymentData.payment_links?.title || 'Payment Plan Installment'
      };

      return formattedPayment;
    } catch (error) {
      console.error('Error in fetchPaymentDataForInstallment:', error);
      toast.error('An error occurred while fetching payment details');
      return null;
    }
  };

  const handleViewPaymentDetails = async (installment: PlanInstallment) => {
    setSelectedInstallment(installment);
    
    const paymentData = await fetchPaymentDataForInstallment(installment);
    if (paymentData) {
      setPaymentData(paymentData);
      setShowPlanDetails(false); // Close the plan details dialog
      setShowPaymentDetails(true); // Open the payment details dialog
    }
  };

  const handleBackToPlans = () => {
    setShowPaymentDetails(false);
    setShowPlanDetails(true);
  };

  const handleCancelPlan = async () => {
    try {
      if (!selectedPlan) return;
      
      const [patientId, paymentLinkId] = selectedPlan.id.split('_');
      const result = await cancelPaymentPlan(patientId, paymentLinkId);
      
      if (result.success) {
        toast.success('Payment plan cancelled successfully');
        setShowCancelDialog(false);
        setShowPlanDetails(false);
        // Refresh payment plans data
        await fetchPaymentPlans();
      }
    } catch (error) {
      console.error('Error in handleCancelPlan:', error);
      toast.error('Failed to cancel payment plan');
    }
  };

  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
  };

  const handlePausePlan = () => {
    toast.info('Pause plan functionality will be implemented soon');
    // We'll implement the actual functionality in the future
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    plans,
    isLoading,
    installments,
    handleViewPlanDetails,
    handleCreatePlanClick,
    handleViewPlansClick,
    handleSendReminder,
    // New properties for payment details
    selectedInstallment,
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    handleViewPaymentDetails,
    handleBackToPlans,
    // New properties for cancel plan
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan,
    handleOpenCancelDialog,
    // Add the new handlePausePlan function to the return object
    handlePausePlan
  };
};
