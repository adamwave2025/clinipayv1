
// File with shared utility functions

/**
 * Generate a payment reference with format CLPxxx-xxx-xxx
 * Used for tracking payments in the system
 */
export const generatePaymentReference = (): string => {
  const prefix = 'CLP';
  const randomDigits = () => Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${randomDigits()}-${randomDigits()}-${randomDigits()}`;
};

/**
 * CORS headers for all responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
