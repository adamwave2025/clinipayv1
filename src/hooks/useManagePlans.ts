
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data for payment plans (will be replaced with real data)
const mockPaymentPlans = [
  {
    id: 'plan-1',
    patientName: 'John Smith',
    planName: 'Dental Treatment',
    amount: 750,
    progress: 66, // percentage
    status: 'active',
    nextDueDate: '2025-05-12',
    totalInstallments: 3,
    paidInstallments: 2,
  },
  {
    id: 'plan-2',
    patientName: 'Sarah Johnson',
    planName: 'Orthodontic Treatment',
    amount: 1200,
    progress: 33, 
    status: 'active',
    nextDueDate: '2025-05-05',
    totalInstallments: 3,
    paidInstallments: 1,
  },
  {
    id: 'plan-3',
    patientName: 'Michael Brown',
    planName: 'Wisdom Teeth Removal',
    amount: 550,
    progress: 100,
    status: 'completed',
    nextDueDate: null,
    totalInstallments: 2,
    paidInstallments: 2,
  },
  {
    id: 'plan-4',
    patientName: 'Emma Wilson',
    planName: 'Root Canal Treatment',
    amount: 800,
    progress: 0,
    status: 'pending',
    nextDueDate: '2025-05-10',
    totalInstallments: 4,
    paidInstallments: 0,
  },
  {
    id: 'plan-5',
    patientName: 'Daniel Lee',
    planName: 'Dental Implant',
    amount: 1500,
    progress: 25,
    status: 'active',
    nextDueDate: '2025-05-18',
    totalInstallments: 4,
    paidInstallments: 1,
  }
];

// Mock data for plan installments (will be replaced with real data)
const mockInstallments = [
  { id: 1, dueDate: '2025-04-01', amount: 250, status: 'paid', paidDate: '2025-04-01' },
  { id: 2, dueDate: '2025-05-01', amount: 250, status: 'paid', paidDate: '2025-05-01' },
  { id: 3, dueDate: '2025-06-01', amount: 250, status: 'upcoming', paidDate: null },
];

export const useManagePlans = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  // Fetch payment plans on mount
  useEffect(() => {
    fetchPaymentPlans();
  }, []);

  const fetchPaymentPlans = async () => {
    setIsLoading(true);
    try {
      // For now, we'll use mock data until we have real payment schedule data
      setPlans(mockPaymentPlans);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPlanDetails = (plan: any) => {
    setSelectedPlan(plan);
    setShowPlanDetails(true);
  };

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  const handleViewPlansClick = () => {
    navigate('/dashboard/payment-plans');
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    plans,
    isLoading,
    mockInstallments,
    handleViewPlanDetails,
    handleCreatePlanClick,
    handleViewPlansClick,
  };
};
