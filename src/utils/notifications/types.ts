
import type { StandardNotificationPayload } from '@/types/notification';

// Define the recipient type for notifications
export type RecipientType = 'patient' | 'clinic';

// Define the notification response structure
export interface NotificationResponse {
  success: boolean;
  error?: string;
  notification_id?: string;
  webhook_success?: boolean;
  webhook_error?: string;
}

// Add the missing WebhookResult type
export interface WebhookResult {
  success: boolean;
  error?: string;
  status_code?: number;
  response_body?: string;
}

// Re-export the StandardNotificationPayload type
export type { StandardNotificationPayload };
