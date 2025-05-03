
import { useNavigate } from 'react-router-dom';

export const usePlanNavigation = () => {
  const navigate = useNavigate();

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  const handleViewPlansClick = () => {
    navigate('/dashboard/payment-plans');
  };

  return {
    handleCreatePlanClick,
    handleViewPlansClick
  };
};
