
import { useNavigate } from 'react-router-dom';

export const usePlanNavigation = () => {
  const navigate = useNavigate();

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  // Navigate back to manage-plans page
  const handleViewPlansClick = () => {
    navigate('/dashboard/manage-plans');
  };

  return {
    handleCreatePlanClick,
    handleViewPlansClick
  };
};
