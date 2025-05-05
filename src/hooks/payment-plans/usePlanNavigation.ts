
import { useNavigate } from 'react-router-dom';

export const usePlanNavigation = () => {
  const navigate = useNavigate();

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  // Restore this function to navigate back to manage-plans page
  const handleViewPlansClick = () => {
    navigate('/dashboard/manage-plans');
  };

  return {
    handleCreatePlanClick,
    handleViewPlansClick
  };
};
