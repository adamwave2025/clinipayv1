
import { Json } from '@/integrations/supabase/types';

/**
 * Type definition for primitive objects that can safely be stored in the database
 */
export interface PrimitiveJsonObject {
  [key: string]: string | number | boolean | null | PrimitiveJsonObject | (string | number | boolean | null)[];
}

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
 * Common response type for notification operations
 * Simplified to use only flat primitive properties to avoid recursive type references
 */
export interface NotificationResponse {
  success: boolean;
  notification_id?: string;
  error_message?: string;
  webhook_success?: boolean;
  webhook_error?: string;
  // Allow additional flat properties but don't use nested objects
  [key: string]: string | number | boolean | undefined;
}
