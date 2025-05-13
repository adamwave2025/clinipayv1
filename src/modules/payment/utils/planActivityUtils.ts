
import { PaymentLink } from '@/types/payment';
import { PaymentLinkData } from '../types/paymentLink';

/**
 * Formats plan activities for display
 */
export function formatPlanActivities(activities: any[]): PlanActivity[] {
  if (!Array.isArray(activities)) {
    console.warn('Invalid activities data, expected array but got:', typeof activities);
    return [];
  }
  
  return activities.map(activity => ({
    id: activity.id || '',
    type: activity.type || 'unknown',
    message: activity.message || 'Unknown activity',
    performedAt: activity.performed_at ? new Date(activity.performed_at) : new Date(),
    performer: activity.performed_by || 'System',
    planId: activity.plan_id || null,
    metadata: activity.metadata || {}
  }));
}

/**
 * Determines if a payment link is still active based on its status
 * Works with both PaymentLink and PaymentLinkData types
 */
export function isPaymentLinkActive(link: PaymentLink | PaymentLinkData | null): boolean {
  if (!link) return false;
  
  // Handle PaymentLink type (has isActive property)
  if ('isActive' in link) {
    return link.isActive === true;
  }
  
  // Handle PaymentLinkData type (might have isActive property)
  return link.isActive === true;
}

export interface PlanActivity {
  id: string;
  type: string;
  message: string;
  performedAt: Date;
  performer: string;
  planId: string | null;
  metadata: Record<string, any>;
}
