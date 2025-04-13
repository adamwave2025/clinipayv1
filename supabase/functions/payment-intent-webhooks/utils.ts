
// Helper function to generate a payment reference
export function generatePaymentReference() {
  // Generate a random alphanumeric string (8 characters)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Add a timestamp to make it unique (last 4 digits of timestamp)
  const timestamp = Date.now().toString();
  const timeComponent = timestamp.substring(timestamp.length - 4);
  
  // Format: PAY-XXXX-YYYY where XXXX is random and YYYY is time-based
  return `PAY-${result}-${timeComponent}`;
}

// Common CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
