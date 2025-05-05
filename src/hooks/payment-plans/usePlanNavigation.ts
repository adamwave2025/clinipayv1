
import { useNavigate } from 'react-router-dom';

export const usePlanNavigation = () => {
  const navigate = useNavigate();

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  // We maintain this function for compatibility, but it now navigates to the payment plans page
  const handleViewPlansClick = () => {
    navigate('/dashboard/payment-plans');
  };

  return {
    handleCreatePlanClick,
    handleViewPlansClick
  };
};
