
import { format } from 'date-fns';

export type PlanActivityType = 
  | 'reschedule'
  | 'pause'
  | 'resume'
  | 'cancel'
  | 'create'
  | 'payment_made'
  | 'reminder_sent';

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
    performedAt: format(new Date(activity.performed_at), 'yyyy-MM-dd HH:mm'),
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
    default: return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
  }
};
