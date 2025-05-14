
import { addToNotificationQueue } from '@/utils/notification-queue';
import { processNotificationsNow } from '@/utils/notification-cron-setup';

/**
 * Service for handling payment notifications
 */
export const NotificationService = {
  /**
   * Add a notification to the queue
   * @param type The type of notification
   * @param payload The notification payload
   * @param recipient_type The recipient type ('patient' or 'clinic')
   * @param clinic_id The clinic ID
   * @param reference_id Optional reference ID
   * @param payment_id Optional payment ID
   * @param processImmediately Whether to process the notification immediately (default: false)
   */
  addToQueue: addToNotificationQueue,
  
  /**
   * Trigger immediate processing of the notification queue
   * This calls the process-notification-queue edge function directly
   */
  processNow: processNotificationsNow
};
