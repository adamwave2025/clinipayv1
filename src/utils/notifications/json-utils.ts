
import { StandardNotificationPayload } from '@/types/notification';
import { Json } from '@/integrations/supabase/types';

/**
 * Creates a primitive payload object that is safe to store as JSON
 * This helps avoid deep type instantiation issues
 * 
 * @param payload The notification payload
 * @returns A JSON-safe copy of the payload
 */
export function createPrimitivePayload(payload: StandardNotificationPayload): Json {
  // Using JSON.parse(JSON.stringify()) to convert to a primitive object
  // This breaks any circular references and complex type structures
  return JSON.parse(JSON.stringify(payload)) as Json;
}

/**
 * Safely converts a JSON payload back to a StandardNotificationPayload
 * Uses type assertion through unknown to avoid deep type instantiation
 * 
 * @param jsonPayload The JSON payload from the database
 * @returns A properly typed notification payload
 */
export function jsonToNotificationPayload(jsonPayload: Json): StandardNotificationPayload {
  // First convert to unknown to break type dependency chain
  const unknownPayload = jsonPayload as unknown;
  
  // Then convert to the expected type
  return unknownPayload as StandardNotificationPayload;
}

/**
 * Validates that a JSON payload has the required properties of a StandardNotificationPayload
 * This helps prevent runtime errors when processing notifications
 * 
 * @param payload The payload to validate
 * @returns True if the payload has the required properties
 */
export function isValidNotificationPayload(payload: any): boolean {
  return (
    payload &&
    typeof payload === 'object' &&
    'notification_type' in payload &&
    'notification_method' in payload &&
    'patient' in payload &&
    'payment' in payload &&
    'clinic' in payload
  );
}
