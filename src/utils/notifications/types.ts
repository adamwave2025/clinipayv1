
/**
 * Define the recipient type for notifications
 */
export type RecipientType = 'patient' | 'clinic';

/**
 * Define the notification response structure
 */
export interface NotificationResponse {
  success: boolean;
  error?: string;
  notification_id?: string;
  webhook_success?: boolean;
  webhook_error?: string;
}

/**
 * Define the webhook result structure
 */
export interface WebhookResult {
  success: boolean;
  error?: string;
  status_code?: number;
  response_body?: string;
}

/**
 * Standard notification payload structure with better typing
 */
export interface NotificationPayload {
  notification_type: string;
  notification_method: {
    email: boolean;
    sms: boolean;
  };
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
      stripe_fee?: number;
      platform_fee?: number;
      net_amount?: number;
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

// Re-export for backward compatibility
export type StandardNotificationPayload = NotificationPayload;
