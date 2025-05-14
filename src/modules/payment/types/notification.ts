
// Define notification-related types for the payment module

// Basic notification settings
export interface NotificationSettings {
  email: boolean;
  sms: boolean;
}

// Method for sending notifications
export interface NotificationMethod {
  email: boolean;
  sms: boolean;
}

// Standard notification payload structure
export interface StandardNotificationPayload {
  recipient: {
    email: string | null;
    phone: string | null;
    name: string;
  };
  clinic: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  payment: {
    reference: string;
    amount: number;
    refund_amount: number | null;
    payment_link: string | null;
    message: string | null;
  };
  notification_method: NotificationMethod;
}

// Notification result after sending
export interface NotificationResult {
  success: boolean;
  notification_id?: string;
  delivery?: {
    webhook: boolean;
    edge_function: boolean;
    fallback: boolean;
    any_success: boolean;
  };
  errors?: {
    webhook?: string;
    edge_function?: string;
    fallback?: string;
  };
  error?: string;
}
