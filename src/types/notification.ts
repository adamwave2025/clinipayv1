
/**
 * Interface representing a notification preference record in the database
 * @deprecated Use the email_notifications and sms_notifications boolean fields in the clinics table instead
 */
export interface NotificationPreference {
  id: string;
  clinic_id: string;
  channel: 'email' | 'sms';
  type: 'payment_received' | 'refund_processed' | 'weekly_summary';
  enabled: boolean;
}

/**
 * Interface representing the UI state for notification settings
 * @deprecated Use the emailNotifications and smsNotifications boolean fields instead
 */
export interface NotificationSettings {
  emailPaymentReceived: boolean;
  emailRefundProcessed: boolean;
  emailWeeklySummary: boolean;
  smsPaymentReceived: boolean;
  smsRefundProcessed: boolean;
}
