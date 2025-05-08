
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

export const getActionTypeLabel = (type: PlanActivityType): string => {
  switch (type) {
    case 'reschedule': return 'Plan Rescheduled';
    case 'pause': return 'Plan Paused';
    case 'resume': return 'Plan Resumed';
    case 'cancel': return 'Plan Cancelled';
    case 'create': return 'Plan Created';
    case 'payment_made': return 'Payment Made';
    case 'reminder_sent': return 'Reminder Sent';
    case 'payment_refund': return 'Payment Refunded';
    case 'overdue': return 'Payment Overdue';
    case 'complete':
    case 'completed': return 'Plan Completed';
    default: {
      // Ensure TypeScript knows this is a string by using type assertion
      const typeAsString = type as string;
      return typeAsString.charAt(0).toUpperCase() + typeAsString.slice(1);
    }
  }
};
