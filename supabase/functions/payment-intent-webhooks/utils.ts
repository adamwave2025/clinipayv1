
// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generates a unique payment reference string
 * @returns A random alphanumeric string for payment reference
 */
export function generatePaymentReference(): string {
  const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Validates payment amount to ensure it's a positive number
 * @param amount The amount to validate
 * @returns Boolean indicating if the amount is valid
 */
export function validatePaymentAmount(amount: number | null | undefined): boolean {
  if (amount === null || amount === undefined) return false;
  if (isNaN(amount)) return false;
  if (amount <= 0) return false;
  return true;
}
