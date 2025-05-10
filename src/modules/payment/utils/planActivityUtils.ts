
import { PaymentLinkData } from '../types/paymentLink';

export interface PlanActivity {
  id: string;
  performedAt: Date;
  activityType: string;
  description: string;
  username?: string;
  metadata?: any;
}

export function isPaymentLinkActive(linkData?: PaymentLinkData | null): boolean {
  if (!linkData) return false;
  
  console.log('Checking payment link status:', {
    status: linkData.status,
    paymentPlan: linkData.paymentPlan,
    id: linkData.id
  });
  
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
}

export const formatPlanActivities = (activities: any[]): PlanActivity[] => {
  if (!Array.isArray(activities)) {
    console.error('formatPlanActivities received invalid input:', activities);
    return [];
  }
  
  try {
    return activities.map(activity => ({
      id: activity.id,
      performedAt: new Date(activity.performed_at),
      activityType: activity.activity_type,
      description: activity.description,
      username: activity.username || undefined,
      metadata: activity.metadata || undefined
    }));
  } catch (error) {
    console.error('Error formatting plan activities:', error);
    return [];
  }
};
