
// Re-export all functionality from the refactored modules
export { 
  addToNotificationQueue,
  checkNotificationExists 
} from './notifications/queue-manager';

export {
  callWebhookDirectly,
  verifyWebhookConfiguration
} from './notifications/webhook-client';
