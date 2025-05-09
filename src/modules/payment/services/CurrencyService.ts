
/**
 * Formats a pence value to a pounds string with £ symbol
 * @param penceAmount - Amount in pence
 * @returns Formatted currency string
 */
export const formatCurrency = (penceAmount: number): string => {
  // Validate the amount first
  if (penceAmount < 1) {
    console.warn('[formatCurrency] Amount in pence (' + penceAmount + ') is below minimum value (1)');
    penceAmount = Math.max(penceAmount, 0);
  }

  const pounds = penceAmount / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
  }).format(pounds);
};

/**
 * Converts pence to pounds
 * @param penceAmount - Amount in pence
 * @returns Amount in pounds
 */
export const penceToPounds = (penceAmount: number): number => {
  console.info('[CurrencyService] Converting ' + penceAmount + 'p to £' + (penceAmount / 100));
  return penceAmount / 100;
};

/**
 * Converts pounds to pence
 * @param poundsAmount - Amount in pounds
 * @returns Amount in pence
 */
export const poundsToPence = (poundsAmount: number): number => {
  const pence = Math.round(poundsAmount * 100);
  console.info('[CurrencyService] Converting £' + poundsAmount + ' to ' + pence + 'p');
  return pence;
};

/**
 * Validates if a pence amount is reasonable
 * @param penceAmount - Amount in pence
 * @param source - Source of the validation (for debugging)
 * @returns true if valid, false if suspicious
 */
export const validatePenceAmount = (penceAmount: number, source: string = 'unknown'): boolean => {
  // Ensure it's a number
  if (isNaN(penceAmount)) {
    console.error(`[CurrencyService] Invalid pence amount (NaN) from ${source}`);
    return false;
  }
  
  // Check if it's zero or negative
  if (penceAmount <= 0) {
    console.warn(`[CurrencyService] Suspicious pence amount: ${penceAmount}`, new Error().stack);
    return false;
  }
  
  // Check if it's unreasonably large
  if (penceAmount > 100000000) { // £1,000,000
    console.warn(`[CurrencyService] Suspiciously large pence amount: ${penceAmount} from ${source}`);
    return false;
  }
  
  return true;
};

/**
 * Validates if a pounds amount is reasonable
 * @param poundsAmount - Amount in pounds
 * @param source - Source of the validation (for debugging)
 * @returns true if valid, false if suspicious
 */
export const validatePoundsAmount = (poundsAmount: number, source: string = 'unknown'): boolean => {
  // Ensure it's a number
  if (isNaN(poundsAmount)) {
    console.error(`[CurrencyService] Invalid pounds amount (NaN) from ${source}`);
    return false;
  }
  
  // Check if it's zero or negative
  if (poundsAmount <= 0) {
    console.warn(`[CurrencyService] Suspicious pounds amount: ${poundsAmount} from ${source}`);
    return false;
  }
  
  // Check if it's unreasonably large
  if (poundsAmount > 1000000) { // £1,000,000
    console.warn(`[CurrencyService] Suspiciously large pounds amount: ${poundsAmount} from ${source}`);
    return false;
  }
  
  return true;
};
