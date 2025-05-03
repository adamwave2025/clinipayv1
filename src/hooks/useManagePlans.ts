
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  fetchUserClinicId, 
  fetchPaymentSchedules,
  fetchPlanInstallments 
} from '@/services/PaymentScheduleService';
import { 
  groupPaymentSchedulesByPlan,
  formatPlanInstallments,
  type Plan,
  type PlanInstallment
} from '@/utils/paymentPlanUtils';

export const useManagePlans = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
    handleSendReminder
  };
};
