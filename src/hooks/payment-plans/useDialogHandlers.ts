
import { useRefundState } from './useRefundState';
import { useViewModeState } from './useViewModeState';
import { useEnhancedNavigation } from './useEnhancedNavigation';

/**
 * Hook for managing dialog states and related handlers
 */
export const useDialogHandlers = () => {
  // Use all the dialog-related hooks
  const { isViewMode, setIsViewMode, handleCreatePlanClick, handleViewPlansClick } = useEnhancedNavigation();
  
  const { 
    refundDialogOpen, setRefundDialogOpen, paymentToRefund,
    openRefundDialog, processRefund 
  } = useRefundState();

  return {
    isViewMode,
    setIsViewMode,
    handleCreatePlanClick,
    handleViewPlansClick,
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    openRefundDialog,
    processRefund
  };
};
