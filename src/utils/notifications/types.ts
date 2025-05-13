
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

// Re-export the StandardNotificationPayload type
export type { StandardNotificationPayload };
