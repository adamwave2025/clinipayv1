
import { useViewModeState } from './useViewModeState';
import { usePlanNavigation } from './usePlanNavigation';

export const useEnhancedNavigation = () => {
  const { isViewMode, setIsViewMode } = useViewModeState();
  const { handleCreatePlanClick, handleViewPlansClick } = usePlanNavigation();
  
  // Update handleCreatePlanClick wrapper to reset view mode
  const wrappedHandleCreatePlanClick = () => {
    setIsViewMode(false);
    handleCreatePlanClick();
  };

  // Update handleViewPlansClick wrapper to set view mode
  const wrappedHandleViewPlansClick = () => {
    setIsViewMode(true);
    handleViewPlansClick();
  };
  
  return {
    isViewMode,
    setIsViewMode,
    handleCreatePlanClick: wrappedHandleCreatePlanClick,
    handleViewPlansClick: wrappedHandleViewPlansClick
  };
};
