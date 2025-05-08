
export type PlanActivityType = 
  | 'reschedule'
  | 'pause'
  | 'resume'
  | 'cancel'
  | 'create'
  | 'payment_made'
  | 'reminder_sent'
  | 'payment_refund'
  | 'overdue'
  | 'complete'
  | 'completed'
  | 'update_status'
  | 'rescheduled'  // Adding explicit 'rescheduled' type
  | string; // Allow for other string values as well

export interface PlanActivity {
  id: string;
  actionType: PlanActivityType;
  performedAt: string;
  performedBy?: string;
  details: any;
}

export const formatPlanActivities = (activities: any[]): PlanActivity[] => {
  if (!activities || activities.length === 0) return [];
  
  return activities.map(activity => ({
    id: activity.id,
    actionType: activity.action_type,
    performedAt: activity.performed_at, // Preserve original ISO timestamp
    performedBy: activity.performed_by_user_id,
    details: activity.details || {}
  }));
};

// Capitalize the first letter of a string
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getActionTypeLabel = (type: PlanActivityType): string => {
  switch (type) {
    case 'reschedule':
    case 'rescheduled': return 'Plan Rescheduled';
    case 'pause': return 'Plan Paused';
    case 'resume': return 'Plan Resumed';
    case 'cancel': return 'Plan Cancelled';
    case 'create': return 'Plan Created';
    case 'payment_made': return 'Payment Made';
    case 'reminder_sent': return 'Reminder Sent';
    case 'payment_refund': return 'Payment Refunded';
    case 'overdue': return 'Payment Overdue';
    case 'update_status': return 'Status Updated';
    case 'complete':
    case 'completed': return 'Plan Completed';
    default: {
      // Ensure TypeScript knows this is a string by using type assertion
      const typeAsString = type as string;
      return typeAsString.charAt(0).toUpperCase() + typeAsString.slice(1);
    }
  }
};

// New helper function to check if a payment link is active
export const isPaymentLinkActive = (linkData: any): boolean => {
  if (!linkData) return false;
  
  // Check specific payment statuses
  if (linkData.status === 'paid' || 
      linkData.status === 'cancelled' || 
      linkData.status === 'paused' ||
      linkData.status === 'completed' ||
      linkData.status === 'rescheduled') {
    return false;
  }
  
  // Check if the payment has been made already (for payment requests)
  if (linkData.isRequest && linkData.paymentId) {
    return false;
  }
  
  // Payment link is active if it's pending, active, or overdue
  return true;
};
