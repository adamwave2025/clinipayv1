
/**
 * Types for notification system
 */

/**
 * Notification method configuration
 */
export interface NotificationMethod {
  email: boolean;
  sms: boolean;
}

/**
 * Standard notification payload format
 */
export interface StandardNotificationPayload {
  notification_type: string;
  notification_method: NotificationMethod;
  patient: {
    name: string;
    email?: string;
    phone?: string;
  };
  payment: {
    reference: string;
    amount: number;
    refund_amount: number | null;
    payment_link: string | null;
    message: string;
    financial_details?: {
      gross_amount?: number;
      stripe_fee?: number;
      platform_fee?: number;
      net_amount?: number;
      refund_amount?: number;
    }
  };
  clinic: {
    id?: string; // Add ID to match RLS policies
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
