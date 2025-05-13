
// Export notification utilities from the real implementation
export { 
  addToNotificationQueue, 
  checkNotificationExists, 
  processNotificationsNow,
  verifyWebhookConfiguration 
} from '../notification-queue';
