
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
 * Generate a manual payment reference with format MAN-XXXXX
 * Used for tracking manually recorded payments in the system
 */
export const generateManualPaymentReference = (): string => {
  const prefix = 'MAN-';
  // Generate 5 random alphanumeric characters
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `${prefix}${result}`;
};
