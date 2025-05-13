
/**
 * Utility functions for working with plan activities
 */
import { PaymentLink } from '../types/payment';

export interface PlanActivity {
  id: string;
  planId: string;
  activityType: 'payment' | 'status_change' | 'reminder' | 'system';
  message: string;
  timestamp: string;
  amount?: number;
  status?: string;
  paymentId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

/**
 * Format plan activities for display
 */
export const formatPlanActivities = (activities: any[]): PlanActivity[] => {
  return activities.map((activity) => ({
    id: activity.id,
    planId: activity.plan_id,
    activityType: activity.activity_type,
    message: activity.message,
    timestamp: activity.created_at,
    amount: activity.amount,
    status: activity.status,
    paymentId: activity.payment_id,
    userId: activity.user_id,
    metadata: activity.metadata,
    isActive: true
  }));
};

/**
 * Check if a payment link is active
 */
export const isPaymentLinkActive = (link?: PaymentLink | null): boolean => {
  if (!link) return false;
  
  // Check for manual active/inactive flag
  if (typeof link.isActive === 'boolean') {
    return link.isActive;
  }
  
  // For DB records, check is_active field
  if (typeof link.is_active === 'boolean') {
    return link.is_active;
  }
  
  // Check for status-based activity
  if (link.status) {
    return !['cancelled', 'completed', 'archived'].includes(link.status.toLowerCase());
  }
  
  // Default to active if no determination can be made
  return true;
};
