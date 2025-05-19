
/**
 * Utility functions for currency handling and validation
 */

/**
 * Log currency information for debugging
 * @param amount Amount in pence
 * @param source Source of the log for tracing
 * @param verbose Whether to log additional information
 * @returns Whether the amount is valid (greater than zero)
 */
export function validatePenceAmount(amount: number, source = 'unknown', verbose = false): boolean {
  if (typeof amount !== 'number') {
    console.error(`[CurrencyService] Invalid amount type: ${typeof amount}, value: ${amount}`);
    return false;
  }
  
  if (amount <= 0) {
    console.warn(`[CurrencyService] Suspicious pence amount: ${amount}`);
    return false;
  }
  
  if (verbose) {
    console.log(`[CurrencyService] Valid amount: ${amount}p from ${source}`);
  }
  
  return true;
}

/**
 * Validate if a pounds amount is reasonable
 * @param amount Amount in pounds
 * @param source Source of the log for tracing
 * @param verbose Whether to log additional information
 * @returns Whether the amount is valid (greater than zero)
 */
export function validatePoundsAmount(amount: number, source = 'unknown', verbose = false): boolean {
  if (typeof amount !== 'number') {
    console.error(`[CurrencyService] Invalid pounds amount type: ${typeof amount}, value: ${amount}`);
    return false;
  }
  
  if (amount <= 0) {
    console.warn(`[CurrencyService] Suspicious pounds amount: ${amount}`);
    return false;
  }
  
  if (amount > 1000000) { // £1,000,000
    console.warn(`[CurrencyService] Suspiciously large pounds amount: ${amount} from ${source}`);
    return false;
  }
  
  if (verbose) {
    console.log(`[CurrencyService] Valid pounds amount: £${amount} from ${source}`);
  }
  
  return true;
}

/**
 * Log detailed currency information for debugging
 * @param amount Amount in pence
 * @param source Source of the log for tracing
 * @param verbose Whether to log additional information
 */
export function debugCurrencyInfo(amount: number, source = 'unknown', verbose = false): void {
  console.log(`[CurrencyService] ${source} amount: ${amount}p (£${penceToPounds(amount)})`);
  
  if (amount <= 0) {
    console.warn(`[CurrencyService] Suspicious pence amount: ${amount}`);
  }
  
  if (verbose) {
    console.log(`[CurrencyService] Converting ${amount}p to £${penceToPounds(amount)}`);
  }
}

/**
 * Convert pence to pounds
 * @param pence Amount in pence
 * @returns Amount in pounds
 */
export function penceToPounds(pence: number): number {
  // Handle string inputs by converting to number
  if (typeof pence === 'string') {
    pence = parseFloat(pence);
  }
  
  // Ensure we're working with a valid number
  if (isNaN(pence) || pence === null) {
    console.warn('Invalid pence amount for conversion:', pence);
    return 0;
  }
  
  return pence / 100;
}

/**
 * Convert pounds to pence
 * @param pounds Amount in pounds
 * @returns Amount in pence
 */
export function poundsToPence(pounds: number | string): number {
  // Handle string inputs by converting to number
  if (typeof pounds === 'string') {
    pounds = parseFloat(pounds);
  }
  
  // Ensure we're working with a valid number
  if (isNaN(pounds) || pounds === null) {
    console.warn('Invalid pounds amount for conversion:', pounds);
    return 0;
  }
  
  return Math.round(pounds * 100);
}
