
import { PaymentLink } from '@/types/payment';

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
 */
export function isPaymentLinkActive(link: PaymentLink | null): boolean {
  if (!link) return false;
  return link.is_active === true;
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
