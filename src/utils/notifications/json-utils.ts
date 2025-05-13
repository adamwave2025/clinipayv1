
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
