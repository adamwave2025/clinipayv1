
export interface NotificationMethod {
  email: boolean;
  sms: boolean;
}

/**
 * Standard notification payload structure used across all notification types
 * Modified to be compatible with Supabase's Json type requirements
 * by ensuring all properties are serializable
 */
export interface StandardNotificationPayload {
  notification_type: 'payment_success' | 'payment_failed' | 'payment_request' | 'refund';
  notification_method: NotificationMethod;
  patient: {
    name: string;
    email?: string;
    phone?: string;
  };
  payment: {
    reference: string | null;
    amount: number;
    refund_amount?: number | null;
    payment_link?: string;
    message: string;
    financial_details?: {
      gross_amount: number;
      stripe_fee: number;
      platform_fee: number;
      net_amount: number;
    };
  };
  clinic: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  error?: {
    message: string;
    code: string;
  };
  [key: string]: any; // Add index signature to satisfy Json type requirements
}

/**
 * Interface representing notification settings for a clinic
 */
export interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
}

/**
 * Interface for payment notifications
 */
export interface PaymentNotification {
  id?: string;
  user_id?: string;
  type: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed';
  recipient: string;
  subject?: string;
  message: string;
  created_at?: string;
  scheduled_for?: string;
  related_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for notification preferences
 */
export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  payment_confirmations: boolean;
  payment_reminders: boolean;
  marketing_updates: boolean;
}
