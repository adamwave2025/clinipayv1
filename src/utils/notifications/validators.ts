
import { NotificationPayload } from './types';

/**
 * Validates that a payload has the required properties to be a valid notification
 * This uses runtime type checking instead of complex TypeScript type validation
 * 
 * @param payload The payload to validate
 * @returns True if the payload has the required properties
 */
export function isValidNotificationPayload(payload: any): payload is NotificationPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  // Check required top-level fields
  if (typeof payload.notification_type !== 'string' ||
      !payload.notification_method ||
      !payload.patient ||
      !payload.payment ||
      !payload.clinic) {
    return false;
  }

  // Check notification method
  if (typeof payload.notification_method.email !== 'boolean' ||
      typeof payload.notification_method.sms !== 'boolean') {
    return false;
  }

  // Check patient (minimal validation)
  if (typeof payload.patient.name !== 'string') {
    return false;
  }

  // Check payment (minimal validation)
  if (typeof payload.payment.reference !== 'string' ||
      typeof payload.payment.amount !== 'number' ||
      typeof payload.payment.message !== 'string') {
    return false;
  }

  // Check clinic (minimal validation)
  if (typeof payload.clinic.name !== 'string') {
    return false;
  }

  return true;
}

/**
 * Safely converts a JSON payload to a NotificationPayload
 * Uses type assertion without deep TypeScript instantiation
 * 
 * @param data The data to convert
 * @returns A properly typed notification payload
 */
export function safelyParseNotificationPayload(data: any): NotificationPayload {
  // Make a shallow copy of the data to avoid reference issues
  const payload = { ...data };
  
  // Ensure numerical values are numbers
  if (payload.payment) {
    if (payload.payment.amount && typeof payload.payment.amount !== 'number') {
      payload.payment.amount = Number(payload.payment.amount);
    }
    if (payload.payment.refund_amount && typeof payload.payment.refund_amount !== 'number') {
      payload.payment.refund_amount = Number(payload.payment.refund_amount);
    }
    
    if (payload.payment.financial_details) {
      const fd = payload.payment.financial_details;
      if (fd.gross_amount && typeof fd.gross_amount !== 'number') {
        fd.gross_amount = Number(fd.gross_amount);
      }
      if (fd.stripe_fee && typeof fd.stripe_fee !== 'number') {
        fd.stripe_fee = Number(fd.stripe_fee);
      }
      if (fd.platform_fee && typeof fd.platform_fee !== 'number') {
        fd.platform_fee = Number(fd.platform_fee);
      }
      if (fd.net_amount && typeof fd.net_amount !== 'number') {
        fd.net_amount = Number(fd.net_amount);
      }
    }
  }

  // Validate the payload
  if (!isValidNotificationPayload(payload)) {
    console.warn('Warning: Invalid notification payload structure', payload);
  }

  // Use type assertion to bypass deep type instantiation
  return payload as NotificationPayload;
}

/**
 * Prepares a notification payload for storage in the database
 * This creates a safe JSON representation without type dependencies
 * 
 * @param payload The notification payload
 * @returns A JSON-safe copy of the payload
 */
export function preparePayloadForStorage(payload: NotificationPayload): any {
  // Simple JSON serialization/deserialization breaks circular references
  // and avoids TypeScript's deep instantiation
  return JSON.parse(JSON.stringify(payload));
}
