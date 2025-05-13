
/**
 * Interface representing notification settings for a clinic
 */
export interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
}

/**
 * Interface representing notification methods based on available patient contact info
 */
export interface NotificationMethod {
  email: boolean;
  sms: boolean;
}

/**
 * Standard notification payload structure used across all notification types
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
    reference: string;
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
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  error?: {
    message: string;
    code: string;
  };
}
