
import { useSharedPlanManagement } from './useSharedPlanManagement';
import { Plan } from '@/utils/planTypes';

/**
 * Hook for handling quick access to plan details and operations in the patient context
 * Now implemented using the shared plan management hook
 */
export const usePlanQuickAccess = () => {
  // Use the shared plan management hook
  const sharedPlanManagement = useSharedPlanManagement();
  
  // Pass through all the properties and methods from the shared hook
  return {
    ...sharedPlanManagement
  };
};
