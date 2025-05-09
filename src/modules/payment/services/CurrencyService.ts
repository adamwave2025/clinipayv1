
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
  // Handle non-numeric inputs
  if (typeof penceAmount !== 'number' || isNaN(penceAmount)) {
    console.warn('[CurrencyService] Invalid pence amount:', penceAmount);
    return 0;
  }
  
  console.info('[CurrencyService] Converting ' + penceAmount + 'p to £' + (penceAmount / 100));
  return penceAmount / 100;
};

/**
 * Converts pounds to pence
 * @param poundsAmount - Amount in pounds
 * @returns Amount in pence
 */
export const poundsToPence = (poundsAmount: number | string): number => {
  // Convert string input to number if needed
  const numericAmount = typeof poundsAmount === 'string' ? parseFloat(poundsAmount) : poundsAmount;
  
  // Handle NaN case
  if (isNaN(numericAmount)) {
    console.warn('[CurrencyService] Invalid pounds amount:', poundsAmount);
    return 0;
  }
  
  const pence = Math.round(numericAmount * 100);
  console.info('[CurrencyService] Converting £' + numericAmount + ' to ' + pence + 'p');
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
  if (typeof penceAmount !== 'number' || isNaN(penceAmount)) {
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
  if (typeof poundsAmount !== 'number' || isNaN(poundsAmount)) {
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

/**
 * Debug utility for inspecting currency values
 * @param amount - Amount to debug
 * @param context - Context description for debugging
 * @param isPence - Whether the amount is in pence (true) or pounds (false)
 */
export const debugCurrencyInfo = (amount: number | null | undefined, context: string, isPence: boolean = true): void => {
  if (amount === null || amount === undefined) {
    console.warn(`[CurrencyDebug] ${context}: null or undefined amount`);
    return;
  }
  
  if (isNaN(amount)) {
    console.error(`[CurrencyDebug] ${context}: Invalid amount (NaN)`);
    return;
  }
  
  if (isPence) {
    // Amount is in pence
    const pounds = penceToPounds(amount);
    console.info(`[CurrencyDebug] ${context}: ${amount}p (£${pounds.toFixed(2)})`);
    validatePenceAmount(amount, context);
  } else {
    // Amount is in pounds
    const pence = poundsToPence(amount);
    console.info(`[CurrencyDebug] ${context}: £${amount} (${pence}p)`);
    validatePoundsAmount(amount, context);
  }
};
