
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
  error?: ErrorDetails; // Add this to match the other definition
  [key: string]: any; // Add index signature to match the other definition
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
  refund_amount: number | null; // Keep as required but allow null
  payment_link: string;
  message: string;
  financial_details?: {
    gross_amount: number;
    stripe_fee: number;
    platform_fee: number;
    net_amount: number;
  };
}

export interface ClinicDetails {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ErrorDetails {
  message: string;
  code: string;
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
  error?: any; // Using any to allow string or error object
}

// Define NotificationResult type to match what's used in services
export interface NotificationResult {
  success: boolean;
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
  notification_id?: string;
  error?: string | any; // Change to allow both string and PostgrestError types
  immediate_processing?: boolean;
}
