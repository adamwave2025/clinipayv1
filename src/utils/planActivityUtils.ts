
/**
 * Interface for plan activity entries
 */
export interface PlanActivity {
  id: string;
  planId: string;
  clinicId: string;
  patientId: string;
  paymentLinkId: string;
  actionType: string;
  performedAt: string;
  performedByUserId?: string;
  details?: {
    installmentId?: string;
    paymentNumber?: number;
    amount?: number;
    originalDate?: string;
    newDate?: string;
    [key: string]: any;
  };
}

/**
 * Format activities from the database into frontend format
 * 
 * @param activities Raw activity data from the database
 * @returns Formatted activities for frontend use
 */
export const formatPlanActivities = (activities: any[]): PlanActivity[] => {
  return activities.map(activity => ({
    id: activity.id,
    planId: activity.plan_id,
    clinicId: activity.clinic_id,
    patientId: activity.patient_id,
    paymentLinkId: activity.payment_link_id,
    actionType: activity.action_type,
    performedAt: activity.performed_at,
    performedByUserId: activity.performed_by_user_id,
    details: activity.details || {}
  }));
};

/**
 * Get a user-friendly label for an action type
 */
export const getActionTypeLabel = (actionType: string): string => {
  switch (actionType) {
    case 'plan_created':
      return 'Plan created';
    case 'payment_marked_paid':
      return 'Payment marked as paid';
    case 'payment_rescheduled':
      return 'Payment rescheduled';
    case 'plan_paused':
      return 'Plan paused';
    case 'plan_resumed':
      return 'Plan resumed';
    case 'plan_rescheduled':
      return 'Plan rescheduled';
    case 'plan_cancelled':
      return 'Plan cancelled';
    default:
      return capitalize(actionType.replace(/_/g, ' '));
  }
};

/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Check if a payment link is active and can be processed
 */
export const isPaymentLinkActive = (linkData?: any | null): boolean => {
  if (!linkData) return false;
  
  // Check status - active links can be processed
  if (linkData.status === 'active') return true;
  
  // For payment plans, check more detailed status
  if (linkData.paymentPlan) {
    // If the plan is active or overdue, we can still process payments
    if (linkData.status === 'active' || linkData.status === 'overdue') {
      return true;
    }
    // All other statuses for payment plans are considered inactive
    return false;
  }
  
  // For regular payment links, only active links are processable
  return linkData.status === 'active';
};
