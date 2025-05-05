
import { useNavigate } from 'react-router-dom';

export const usePlanNavigation = () => {
  const navigate = useNavigate();

  // Instead of navigating to create-link page, this will be used to open dialog 
  // The actual implementation is in ManagePlansHeader component
  const handleCreatePlanClick = () => {
    // This is now a no-op as we'll handle it in the component
    // Dialog will be controlled via local state
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
