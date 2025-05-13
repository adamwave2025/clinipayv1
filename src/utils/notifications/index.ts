
// Export all notification functions from this new implementation
export { 
  addToNotificationQueue,
  checkNotificationExists,
  processNotificationsNow
} from './queue-service';

export {
  callWebhookDirectly,
  verifyWebhookConfiguration
} from './webhook-service';

// Export types
export type {
  NotificationResponse,
  RecipientType,
  WebhookResult,
  NotificationPayload,
  StandardNotificationPayload
} from './types';
