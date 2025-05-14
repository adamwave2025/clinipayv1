
/**
 * Standard notification payload structure used across the application
 * This ensures consistency in the data sent to notification services
 */
export interface StandardNotificationPayload {
  notification_type: "payment_request" | "payment_success" | "payment_failed" | "refund";
  notification_method: NotificationMethod;
  patient: PatientDetails;
  payment: PaymentDetails;
  clinic: ClinicDetails;
}

export interface NotificationMethod {
  email: boolean;
  sms: boolean;
}

export interface PatientDetails {
  name: string;
  email?: string;
  phone?: string;
}

export interface PaymentDetails {
  reference: string | null;
  amount: number;
  refund_amount: number | null;
  payment_link: string;
  message: string;
}

export interface ClinicDetails {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Notification delivery status returned when a notification is queued
 */
export interface NotificationDeliveryStatus {
  webhook: boolean;
  edge_function: boolean;
  fallback: boolean;
  any_success: boolean;
}

/**
 * Result of adding a notification to the queue
 */
export interface NotificationQueueResult {
  success: boolean;
  notification_id?: string;
  delivery?: NotificationDeliveryStatus;
  errors?: {
    webhook?: string;
    edge_function?: string;
    fallback?: string;
  };
  immediate_processing?: boolean;
  error?: any;
}
