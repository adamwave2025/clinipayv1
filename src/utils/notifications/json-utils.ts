
import { FlatJsonValue, FlatJsonRecord } from './types';
import { StandardNotificationPayload } from '@/types/notification';

/**
 * Creates a simplified notification payload with only primitive values
 * Avoids nested structure problems by flattening complex objects
 */
export function createPrimitivePayload(payload: StandardNotificationPayload): Record<string, FlatJsonValue> {
  // Create a flat structure with only necessary fields
  const primitivePayload: Record<string, FlatJsonValue> = {
    // Notification basics
    notification_type: payload.notification_type,
    
    // Notification methods as simple booleans
    email_enabled: payload.notification_method.email,
    sms_enabled: payload.notification_method.sms,
    
    // Patient details as flat values
    patient_name: payload.patient.name,
    patient_email: payload.patient.email || null,
    patient_phone: payload.patient.phone || null,
    
    // Payment details as flat values
    payment_reference: payload.payment.reference,
    payment_amount: payload.payment.amount,
    payment_refund_amount: payload.payment.refund_amount || null,
    payment_link: payload.payment.payment_link || null,
    payment_message: payload.payment.message,
    
    // Clinic details as flat values
    clinic_name: payload.clinic.name,
    clinic_email: payload.clinic.email || null,
    clinic_phone: payload.clinic.phone || null,
    clinic_address: payload.clinic.address || null
  };
  
  // Add financial details if present as flat values
  if (payload.payment.financial_details) {
    primitivePayload.financial_gross_amount = payload.payment.financial_details.gross_amount;
    primitivePayload.financial_stripe_fee = payload.payment.financial_details.stripe_fee;
    primitivePayload.financial_platform_fee = payload.payment.financial_details.platform_fee;
    primitivePayload.financial_net_amount = payload.payment.financial_details.net_amount;
  }
  
  // Add error information if present
  if (payload.error) {
    primitivePayload.error_message = payload.error.message;
    primitivePayload.error_code = payload.error.code;
  }
  
  return primitivePayload;
}

/**
 * Safely converts any value to a string representation
 * with length limitation to avoid huge strings in the database
 */
export function safeString(value: any, maxLength: number = 255): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value.substring(0, maxLength);
  }
  
  try {
    return String(value).substring(0, maxLength);
  } catch (err) {
    return 'Value cannot be converted to string';
  }
}

/**
 * Creates a record with only primitive values suitable for database storage
 */
export function createErrorDetails(details: Record<string, any>): FlatJsonRecord {
  const result: FlatJsonRecord = {};
  
  // Extract only primitive values with length limits for strings
  Object.keys(details).forEach(key => {
    const value = details[key];
    if (value === null) {
      result[key] = null;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      result[key] = value;
    } else {
      result[key] = safeString(value);
    }
  });
  
  return result;
}
