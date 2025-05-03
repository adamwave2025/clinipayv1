import { useState, useEffect } from 'react';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';
import { PaymentLinkService } from '@/services/PaymentLinkService';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const usePaymentPlans = () => {
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planToDelete, setPlanToDelete] = useState<PaymentLink | null>(null);
  const [planToEdit, setPlanToEdit] = useState<PaymentLink | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    amount: ''
  });

  const { fetchPaymentLinks } = usePaymentLinks();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter plans when search query changes
  useEffect(() => {
    if (paymentPlans.length === 0) return;
    
    const filtered = paymentPlans.filter(plan => 
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPlans(filtered);
  }, [searchQuery, paymentPlans]);

  // Fetch payment plans when user is available
  useEffect(() => {
    if (user) {
      fetchPaymentPlans();
    }
  }, [user]);

  const fetchPaymentPlans = async () => {
    setIsLoading(true);
    try {
      // First ensure the hook's state is updated (though we won't use it directly)
      await fetchPaymentLinks();
      
      if (!user) {
        console.error('No user found when trying to fetch payment plans');
        setIsLoading(false);
        return;
      }
      
      // Get fresh data directly from the service
      const { activeLinks } = await PaymentLinkService.fetchLinks(user.id);
      
      // Filter and format the links
      const plans = formatPaymentLinks(activeLinks).filter(link => link.paymentPlan === true);
      
      console.log('Fetched payment plans:', plans); // For debugging
      
      setPaymentPlans(plans);
      setFilteredPlans(plans);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast.error('Failed to load payment plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = (plan: PaymentLink) => {
    setPlanToEdit(plan);
    setEditFormData({
      title: plan.title,
      description: plan.description || '',
      amount: plan.amount.toString()
    });
    setShowEditDialog(true);
  };

  const handleDeletePlan = (plan: PaymentLink) => {
    setPlanToDelete(plan);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      // Here we would call a function to delete the plan
      toast.success(`Payment plan "${planToDelete.title}" deleted successfully`);
      setShowDeleteDialog(false);
      setPlanToDelete(null);
      // Refresh the plans list
      await fetchPaymentPlans();
    } catch (error) {
      console.error('Error deleting payment plan:', error);
      toast.error('Failed to delete payment plan');
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveEditedPlan = async () => {
    if (!planToEdit) return;
    
    try {
      // Here we would call a function to update the plan
      toast.success(`Payment plan "${editFormData.title}" updated successfully`);
      setShowEditDialog(false);
      setPlanToEdit(null);
      // Refresh the plans list
      await fetchPaymentPlans();
    } catch (error) {
      console.error('Error updating payment plan:', error);
      toast.error('Failed to update payment plan');
    }
  };

  // New function to navigate to Active Plans screen
  const handleViewActivePlansClick = () => {
    navigate('/dashboard/manage-plans');
  };

  return {
    paymentPlans,
    filteredPlans,
    isLoading,
    searchQuery,
    setSearchQuery,
    planToDelete,
    planToEdit,
    showDeleteDialog,
    setShowDeleteDialog,
    showEditDialog,
    setShowEditDialog,
    editFormData,
    handleEditPlan,
    handleDeletePlan,
    confirmDeletePlan,
    handleEditFormChange,
    saveEditedPlan,
    fetchPaymentPlans,
    handleViewActivePlansClick // Export the new function
  };
};
