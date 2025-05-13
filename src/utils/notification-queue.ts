// Export real implementations directly
export { 
  addToNotificationQueue,
  checkNotificationExists,
  processNotificationsNow
} from './notification-queue-impl';

// Keep webhooks-related functions exported through webhook-caller.ts
export {
  callWebhookDirectly,
  verifyWebhookConfiguration
} from './webhook-caller';
