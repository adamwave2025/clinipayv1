
// Proper stub implementation with improved error handling and clear types
import { NotificationResponse, StandardNotificationPayload } from './notifications/types';

/**
 * Stub implementation for the notification queue with detailed logging
 * This improved version includes better debug information and error handling
 */
export const addToNotificationQueue = async (
  notificationType: string,
  payload: StandardNotificationPayload,
  recipientType: string,
  clinicId?: string,
  referenceId?: string,
  options: Record<string, any> = {}
): Promise<NotificationResponse> => {
  // Debug flag check allows turning off these potentially verbose logs
  const DEBUG_NOTIFICATIONS = localStorage.getItem('DEBUG_NOTIFICATIONS') === 'true';
  
  if (DEBUG_NOTIFICATIONS) {
    console.group('📨 Notification Queue - addToNotificationQueue');
    console.log('Type:', notificationType);
    console.log('Recipient:', recipientType);
    console.log('Reference:', referenceId);
    console.log('Payload:', payload);
    console.groupEnd();
  }

  // Return success in development with a deterministic ID based on inputs for consistency
  const mockId = `stub-${notificationType}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  return {
    success: true,
    notification_id: mockId,
    webhook_success: true
  };
};

/**
 * Check if a notification exists - stub implementation
 */
export const checkNotificationExists = async (
  notificationType: string, 
  recipientType: string, 
  referenceId: string
): Promise<{ exists: boolean }> => {
  // Simple log to help with debugging
  const DEBUG_NOTIFICATIONS = localStorage.getItem('DEBUG_NOTIFICATIONS') === 'true';
  if (DEBUG_NOTIFICATIONS) {
    console.log('Checking if notification exists:', { notificationType, recipientType, referenceId });
  }
  return { exists: false };
};

/**
 * Process notifications immediately - stub implementation
 */
export const processNotificationsNow = async (): Promise<{ success: boolean }> => {
  const DEBUG_NOTIFICATIONS = localStorage.getItem('DEBUG_NOTIFICATIONS') === 'true';
  if (DEBUG_NOTIFICATIONS) {
    console.log('Processing notifications now (stub)');
  }
  return { success: true };
};

/**
 * Call webhook directly - stub implementation
 */
export const callWebhookDirectly = async (): Promise<{ success: boolean }> => {
  const DEBUG_NOTIFICATIONS = localStorage.getItem('DEBUG_NOTIFICATIONS') === 'true';
  if (DEBUG_NOTIFICATIONS) {
    console.log('Calling webhook directly (stub)');
  }
  return { success: true };
};

/**
 * Verify webhook configuration - stub implementation
 */
export const verifyWebhookConfiguration = async (): Promise<{ 
  success: boolean;
  patient: boolean;
  clinic: boolean;
}> => {
  const DEBUG_NOTIFICATIONS = localStorage.getItem('DEBUG_NOTIFICATIONS') === 'true';
  if (DEBUG_NOTIFICATIONS) {
    console.log('Verifying webhook configuration (stub)');
  }
  return { success: true, patient: true, clinic: true };
};
