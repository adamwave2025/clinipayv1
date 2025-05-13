
import { Json } from '@/integrations/supabase/types';

/**
 * Notification status types
 */
export type NotificationStatus = 'pending' | 'sent' | 'failed';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'high' | 'normal' | 'low';

/**
 * Recipient type for notifications
 */
export type RecipientType = 'patient' | 'clinic';

/**
 * Simple response type for notification operations with primitive values only
 */
export interface NotificationResponse {
  success: boolean;
  notification_id?: string;
  error_message?: string;
  error?: string;
  webhook_success?: boolean;
  webhook_error?: string;
  status_code?: number;
  response_body?: string;
}

/**
 * Simple structure for webhook results
 */
export interface WebhookResult {
  success: boolean;
  error?: string;
  status_code?: number;
  response_body?: string;
}

// Re-export StandardNotificationPayload from the types directory
export type { StandardNotificationPayload } from '@/types/notification';
