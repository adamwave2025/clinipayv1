
import { PrimitiveJsonObject } from './types';

/**
 * Helper function to safely convert any object to a primitive Json-safe structure
 */
export function toPrimitiveJson(data: unknown): PrimitiveJsonObject {
  if (data === null || data === undefined) {
    return {};
  }
  
  if (typeof data !== 'object') {
    return { value: String(data) };
  }
  
  // Create a basic primitive object
  const result: PrimitiveJsonObject = {};
  
  // Only copy primitive properties to avoid circular references
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = null;
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value;
    } else if (typeof value === 'object') {
      try {
        // For objects, create a simple string representation or extract key properties
        result[key] = JSON.stringify(value).substring(0, 255);
      } catch (err) {
        result[key] = 'Complex object (cannot stringify)';
      }
    } else {
      // Convert any other types to strings
      result[key] = String(value);
    }
  }
  
  return result;
}

/**
 * Creates a simplified notification payload with only primitive values
 */
export function createPrimitivePayload(payload: any): PrimitiveJsonObject {
  const primitivePayload: PrimitiveJsonObject = {
    notification_type: payload.notification_type,
    notification_method: {
      email: payload.notification_method.email,
      sms: payload.notification_method.sms
    },
    patient: {
      name: payload.patient.name,
      email: payload.patient.email || null,
      phone: payload.patient.phone || null
    },
    payment: {
      reference: payload.payment.reference,
      amount: payload.payment.amount,
      refund_amount: payload.payment.refund_amount || null,
      payment_link: payload.payment.payment_link || null,
      message: payload.payment.message
    },
    clinic: {
      name: payload.clinic.name,
      email: payload.clinic.email || null,
      phone: payload.clinic.phone || null,
      address: payload.clinic.address || null
    }
  };
  
  // Add financial details if present, but only with primitive values
  if (payload.payment.financial_details) {
    primitivePayload.payment = {
      reference: payload.payment.reference,
      amount: payload.payment.amount,
      refund_amount: payload.payment.refund_amount || null,
      payment_link: payload.payment.payment_link || null,
      message: payload.payment.message,
      financial_details: {
        gross_amount: payload.payment.financial_details.gross_amount,
        stripe_fee: payload.payment.financial_details.stripe_fee,
        platform_fee: payload.payment.financial_details.platform_fee,
        net_amount: payload.payment.financial_details.net_amount
      }
    };
  }
  
  // Add error information if present
  if (payload.error) {
    primitivePayload.error = {
      message: payload.error.message,
      code: payload.error.code
    };
  }
  
  return primitivePayload;
}
