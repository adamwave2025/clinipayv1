
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentLink } from '@/types/payment';
import { PaymentPlanService } from '@/services/PaymentPlanService';

export const usePaymentPlanActions = (fetchPlans: () => Promise<void>) => {
  const [planToDelete, setPlanToDelete] = useState<PaymentLink | null>(null);
  const [planToEdit, setPlanToEdit] = useState<PaymentLink | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    amount: ''
  });
  
  const navigate = useNavigate();

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
    
    const { success } = await PaymentPlanService.deletePlan(planToDelete);
    
    if (success) {
      setShowDeleteDialog(false);
      setPlanToDelete(null);
      // Refresh the plans list
      await fetchPlans();
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveEditedPlan = async () => {
    if (!planToEdit) return;
    
    const { success } = await PaymentPlanService.updatePlan(planToEdit, editFormData);
    
    if (success) {
      setShowEditDialog(false);
      setPlanToEdit(null);
      // Refresh the plans list
      await fetchPlans();
    }
  };

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  const handleViewActivePlansClick = () => {
    navigate('/dashboard/manage-plans');
  };

  return {
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
    handleCreatePlanClick,
    handleViewActivePlansClick
  };
};
