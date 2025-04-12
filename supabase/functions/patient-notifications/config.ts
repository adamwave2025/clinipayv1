
// Configuration and constants for the patient-notifications function

// CORS headers for cross-origin requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retry configuration
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY = 1000; // 1 second

// Helper function to sleep for a specified time
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Define notification types
export type NotificationType = "payment_success" | "payment_refund" | "payment_request";

// Define payload structure for notifications
export interface NotificationPayload {
  table: string;
  operation: string;
  notification_type: NotificationType;
  record_id: string;
}

// Define structure for formatted payload to GHL
export interface FormattedPayload {
  notification_type: string;
  notification_method: {
    sms: boolean;
    email: boolean;
  };
  patient: {
    name: string;
    email: string;
    phone: string;
  };
  payment: {
    reference: string;
    amount: number;
    refund_amount: number | null;
    payment_link: string;
    message: string;
  };
  clinic: {
    name: string;
    phone: string;
    email: string;
  };
}
