
import { Json } from '@/integrations/supabase/types';

/**
 * Notification status types
 */
export type NotificationStatus = 'pending' | 'sent' | 'failed';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'high' | 'normal' | 'low';

/**
 * Recipient type for notifications
 */
export type RecipientType = 'patient' | 'clinic';

/**
 * Simple type for flat property storage
 * Non-recursive, flat structure for database storage
 * This explicit definition prevents excessive type instantiation
 */
export type FlatJsonValue = string | number | boolean | null;

/**
 * Safe record type for storing flat JSON data without recursion
 * Explicitly non-recursive to prevent TypeScript from deep instantiation
 */
export type FlatJsonRecord = {
  [key: string]: FlatJsonValue;
};

/**
 * Response type for notification operations with only primitive values
 * No recursive types allowed to prevent infinite type instantiation
 */
export interface NotificationResponse {
  success: boolean;
  notification_id?: string;
  error_message?: string;
  error?: string;
  webhook_success?: boolean;
  webhook_error?: string;
  status_code?: number;
  response_body?: string;
}

/**
 * Structure for WebhookResult to ensure consistent return types
 */
export interface WebhookResult {
  success: boolean;
  error?: string;
  status_code?: number;
  response_body?: string;
}

/**
 * Type for webhook error details with primitive values only
 */
export interface WebhookErrorDetails {
  status: number;
  statusText: string;
  responseBody: string;
  webhook: string;
  recipientType: string;
}
