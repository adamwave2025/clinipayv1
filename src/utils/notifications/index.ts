
// Export all notification functions from the stub implementation
import { 
  addToNotificationQueue,
  checkNotificationExists,
  processNotificationsNow,
  callWebhookDirectly,
  verifyWebhookConfiguration
} from '../notification-stub';

// Export types
import type {
  NotificationResponse,
  RecipientType,
  WebhookResult,
  NotificationPayload,
  StandardNotificationPayload
} from './types';

// Re-export functions
export { 
  addToNotificationQueue,
  checkNotificationExists,
  processNotificationsNow,
  callWebhookDirectly,
  verifyWebhookConfiguration
};

// Re-export types
export type {
  NotificationResponse,
  RecipientType,
  WebhookResult,
  NotificationPayload,
  StandardNotificationPayload
};
