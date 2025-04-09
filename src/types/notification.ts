
/**
 * Interface representing a notification preference record in the database
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
 */
export interface NotificationSettings {
  emailPaymentReceived: boolean;
  emailRefundProcessed: boolean;
  emailWeeklySummary: boolean;
  smsPaymentReceived: boolean;
  smsRefundProcessed: boolean;
}
