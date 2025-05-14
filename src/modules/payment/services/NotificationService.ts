
import { addToNotificationQueue } from '@/utils/notification-queue';
import { processNotificationsNow } from '@/utils/notification-cron-setup';

/**
 * Service for handling payment notifications
 */
export const NotificationService = {
  /**
   * Add a notification to the queue
   */
  addToQueue: addToNotificationQueue,
  
  /**
   * Trigger immediate processing of the notification queue
   */
  processNow: processNotificationsNow
};
