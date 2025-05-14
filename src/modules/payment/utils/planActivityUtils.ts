
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
  if (!linkData) {
    console.log('Payment link check: No link data provided');
    return false;
  }
  
  console.log('Checking payment link status:', {
    id: linkData.id,
    status: linkData.status, 
    isActive: linkData.isActive,
    paymentPlan: linkData.isPaymentPlan  // Use isPaymentPlan property
  });
  
  // First check if we have an explicit isActive property (directly from DB)
  if (linkData.isActive === false) {
    console.log(`Payment link ${linkData.id} is explicitly marked as inactive`);
    return false;
  }
  
  // For status-based checks (both payment plans and regular links)
  // These are the statuses that indicate an active/processable link
  const activeStatuses = ['active', 'overdue', 'pending', 'sent'];
  
  if (activeStatuses.includes(linkData.status)) {
    console.log(`Payment link ${linkData.id} has active status: ${linkData.status}`);
    return true;
  }
  
  // For payment plans with special handling
  if (linkData.isPaymentPlan) {  // Use isPaymentPlan property consistently
    // Payment plans can be processed if they are active or overdue
    if (linkData.status === 'active' || linkData.status === 'overdue') {
      console.log(`Payment plan ${linkData.id} is processable with status: ${linkData.status}`);
      return true;
    }
    
    // All other statuses for payment plans are considered inactive
    console.log(`Payment plan ${linkData.id} is not processable with status: ${linkData.status}`);
    return false;
  }
  
  // If we have no clear indication, check if there's any explicitly inactive status
  const inactiveStatuses = ['cancelled', 'paused', 'rescheduled', 'completed'];
  if (inactiveStatuses.includes(linkData.status)) {
    console.log(`Payment link ${linkData.id} has inactive status: ${linkData.status}`);
    return false;
  }
  
  // Default to active if we have no other indication
  // This is to prevent false negatives for links that have non-standard statuses
  console.log(`Payment link ${linkData.id} has non-standard status (${linkData.status}), defaulting to active`);
  return true;
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
