
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isAfter } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useManagePlans = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData.clinic_id) {
        setIsLoading(false);
        return;
      }

      // Fetch payment schedule grouped by patient and payment_link
      const { data, error } = await supabase
        .from('payment_schedule')
        .select(`
          id,
          patient_id,
          payment_link_id,
          amount,
          due_date,
          payment_number,
          total_payments,
          status,
          payment_request_id,
          payment_requests (
            id,
            status,
            payment_id
          ),
          patients (
            id,
            name,
            email,
            phone
          ),
          payment_links (
            id,
            title,
            amount,
            plan_total_amount
          )
        `)
        .eq('clinic_id', userData.clinic_id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Process data to group by patient_id and payment_link_id
      const plansByPatient = new Map();
      
      if (data && data.length > 0) {
        data.forEach(entry => {
          // Create a unique key for each patient's plan
          const planKey = `${entry.patient_id || 'unknown'}_${entry.payment_link_id}`;
          
          if (!plansByPatient.has(planKey)) {
            // Initialize plan data
            plansByPatient.set(planKey, {
              id: planKey,
              patientId: entry.patient_id,
              patientName: entry.patients?.name || 'Unknown Patient',
              planName: entry.payment_links?.title || 'Payment Plan',
              amount: entry.payment_links?.plan_total_amount || 0,
              totalInstallments: entry.total_payments,
              paidInstallments: 0,
              progress: 0,
              status: 'active',
              nextDueDate: null,
              schedule: [],
              hasOverduePayments: false
            });
          }
          
          // Add this entry to the plan's schedule
          const plan = plansByPatient.get(planKey);
          
          // Check if this installment is overdue (pending or sent and due date is in the past)
          const dueDate = new Date(entry.due_date);
          const now = new Date();
          now.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
          
          // UPDATED: Consider both 'pending' and 'processed' and 'sent' status for overdue check
          const isOverdue = (entry.status === 'pending' || entry.status === 'processed' || entry.status === 'sent') && 
                           dueDate < now && 
                           !entry.payment_requests?.payment_id;
          
          if (isOverdue) {
            plan.hasOverduePayments = true;
          }
          
          plan.schedule.push({
            id: entry.id,
            dueDate: entry.due_date,
            amount: entry.amount,
            status: entry.status,
            paymentNumber: entry.payment_number,
            totalPayments: entry.total_payments,
            paymentRequestId: entry.payment_request_id,
            requestStatus: entry.payment_requests?.status,
            isOverdue: isOverdue
          });
          
          // Update paid installments count and progress
          // CHANGED: Only count as paid if payment was actually made 
          // (status is 'sent' AND payment request has a payment_id OR request status is 'paid')
          const isPaid = (entry.status === 'sent' && entry.payment_requests?.payment_id) || 
                         entry.payment_requests?.status === 'paid';
          if (isPaid) {
            plan.paidInstallments += 1;
          }
        });
        
        // Calculate progress and other derived fields for each plan
        plansByPatient.forEach(plan => {
          // Calculate progress percentage
          plan.progress = Math.round((plan.paidInstallments / plan.totalInstallments) * 100);
          
          // Sort schedule by due date
          plan.schedule.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
          
          // Determine plan status - UPDATED LOGIC ORDER
          // 1. First check for overdue payments
          if (plan.hasOverduePayments) {
            plan.status = 'overdue';
          }
          // 2. Then check if it's completed
          else if (plan.progress === 100) {
            plan.status = 'completed';
          }
          // 3. Then check if it's pending (no payments made)
          else if (plan.paidInstallments === 0) {
            plan.status = 'pending';
          }
          // 4. Otherwise it's active
          else {
            plan.status = 'active';
          }
          
          // Find the next due date (first non-paid installment)
          const upcoming = plan.schedule.find(entry => entry.status === 'pending');
          plan.nextDueDate = upcoming ? upcoming.dueDate : null;
        });
      }
      
      setPlans(Array.from(plansByPatient.values()));
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast.error('Failed to load payment plans');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPlanInstallments = async (planId: string) => {
    try {
      const [patientId, paymentLinkId] = planId.split('_');
      
      if (!patientId || !paymentLinkId) {
        throw new Error('Invalid plan ID');
      }
      
      // Fetch installments for this plan
      const { data, error } = await supabase
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
      const formattedInstallments = data.map(item => {
        const dueDate = format(parseISO(item.due_date), 'yyyy-MM-dd');
        const paidDate = item.payment_requests?.paid_at 
          ? format(parseISO(item.payment_requests.paid_at), 'yyyy-MM-dd')
          : null;
          
        // Check if it's overdue
        const now = new Date();
        const due = parseISO(item.due_date);
        const isPaid = item.payment_requests?.payment_id || item.payment_requests?.status === 'paid';
        
        // UPDATED: Determine status more accurately
        let status;
        
        if (item.payment_requests?.payment_id || item.payment_requests?.status === 'paid') {
          status = 'paid';
        } else if (item.status === 'sent' || item.status === 'processed') {
          // If sent/processed but due date has passed, mark as overdue
          status = now > due ? 'overdue' : 'sent';
        } else if (item.status === 'pending') {
          // Check if it's overdue
          status = now > due ? 'overdue' : 'upcoming';
        } else {
          status = item.status;
        }
        
        return {
          id: item.id,
          dueDate,
          amount: item.amount,
          status,
          paidDate,
          paymentNumber: item.payment_number,
          totalPayments: item.total_payments,
          paymentRequestId: item.payment_request_id
        };
      });
      
      setInstallments(formattedInstallments);
      return formattedInstallments;
    } catch (error) {
      console.error('Error fetching plan installments:', error);
      toast.error('Failed to load payment details');
      return [];
    }
  };

  const handleViewPlanDetails = async (plan: any) => {
    setSelectedPlan(plan);
    await fetchPlanInstallments(plan.id);
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
