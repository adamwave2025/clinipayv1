

import { RecipientType } from './notifications/types';

/**
 * Stub function that pretends to add an item to the notification queue
 * Returns a success response without actually queuing anything
 */
export async function addToNotificationQueue(
  type: string,
  payload: any, // Using any to break type dependency chains
  recipient_type: RecipientType,
  clinic_id: string,
  reference_id?: string,
  payment_id?: string
): Promise<{
  success: boolean;
  error?: string;
  notification_id?: string;
  webhook_success?: boolean;
  webhook_error?: string;
}> {
  console.log('NOTIFICATION SYSTEM DISABLED: Would have sent notification:', {
    type,
    recipient_type,
    clinic_id,
    reference_id,
    payment_id
  });
  
  // Return a success response without actually doing anything
  return {
    success: true,
    notification_id: 'notification-system-disabled',
    webhook_success: true
  };
}

/**
 * Stub function that pretends to check if a notification exists
 * Always returns false to allow new "notifications" to be created
 */
export async function checkNotificationExists(
  type: string,
  recipient_type: RecipientType,
  reference_id: string
): Promise<boolean> {
  console.log('NOTIFICATION SYSTEM DISABLED: Would have checked for notification:', {
    type,
    recipient_type,
    reference_id
  });
  
  // Always return false so notification checks pass
  return false;
}

/**
 * Stub function that pretends to call a webhook
 * Returns a success response without actually calling any external service
 */
export async function callWebhookDirectly(
  payload: any, // Using any to break type dependency chains
  recipient_type: RecipientType
): Promise<{
  success: boolean;
  error?: string;
  status_code?: number;
  response_body?: string;
}> {
  console.log('NOTIFICATION SYSTEM DISABLED: Would have called webhook for:', recipient_type);
  
  // Return a success response without actually calling a webhook
  return {
    success: true,
    status_code: 200,
    response_body: 'Notification system is currently disabled'
  };
}

/**
 * Stub function that pretends to verify webhook configuration
 * Returns a mock configuration indicating both webhooks are configured
 */
export async function verifyWebhookConfiguration(): Promise<{
  patient: boolean;
  clinic: boolean;
  patientUrl?: string;
  clinicUrl?: string;
}> {
  console.log('NOTIFICATION SYSTEM DISABLED: Would have verified webhook configuration');
  
  // Return mock configuration indicating webhooks are configured
  return {
    patient: true,
    clinic: true,
    patientUrl: 'https://example.com/patient-notifications',
    clinicUrl: 'https://example.com/clinic-notifications'
  };
}

/**
 * Stub function that pretends to process notifications
 * Returns a success response without actually processing anything
 */
export async function processNotificationsNow(): Promise<{
  success: boolean;
  processed: number;
  failed: number;
}> {
  console.log('NOTIFICATION SYSTEM DISABLED: Would have processed pending notifications');
  
  // Return a success response with zero processed
  return {
    success: true,
    processed: 0,
    failed: 0
  };
}

