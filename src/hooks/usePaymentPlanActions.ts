
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentLink } from '@/types/payment';

export const usePaymentPlanActions = (fetchPlans: () => Promise<void>) => {  
  const navigate = useNavigate();

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  const handleViewActivePlansClick = () => {
    navigate('/dashboard/manage-plans');
  };

  return {
    handleCreatePlanClick,
    handleViewActivePlansClick
  };
};
