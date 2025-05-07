
/**
 * CurrencyService
 * 
 * A central service for handling all currency conversions and validations.
 * This ensures consistent handling of monetary amounts throughout the application.
 * 
 * IMPORTANT GUIDELINES:
 * 
 * 1. Database/API values are always stored in pence/cents (integer values)
 * 2. UI/display values are always in pounds/dollars (decimal values)
 * 3. Stripe expects values in pence/cents (integer values)
 * 
 * Use the appropriate conversion functions based on the context:
 * - penceToPounds: When converting DB/API values to display in UI
 * - poundsToPence: When converting user input to store in DB/API
 */

// Validation thresholds
const MIN_AMOUNT_PENCE = 1; // 1p minimum
const MAX_AMOUNT_PENCE = 10000000000; // £100,000,000 maximum
const MAX_AMOUNT_POUNDS = 10000000; // £10,000,000 maximum

/**
 * Convert pence/cents to pounds/dollars
 * For values coming FROM the database/API TO display in UI
 * 
 * @param pence Amount in pence/cents (integer)
 * @returns Amount in pounds/dollars (decimal)
 */
export function penceToPounds(pence: number | null | undefined): number {
  if (pence === null || pence === undefined) return 0;
  
  // Validate the amount is within reasonable range
  if (!validatePenceAmount(pence)) {
    console.warn(`[CurrencyService] Suspicious pence amount: ${pence}`);
  }
  
  // Convert to pounds by dividing by 100
  return pence / 100;
}

/**
 * Convert pounds/dollars to pence/cents
 * For values going FROM user input/UI TO the database/API/Stripe
 * 
 * @param pounds Amount in pounds/dollars (decimal)
 * @returns Amount in pence/cents (integer)
 */
export function poundsToPence(pounds: number | string | null | undefined): number {
  if (pounds === null || pounds === undefined) return 0;
  
  // Convert string to number if needed
  const numericAmount = typeof pounds === 'string' ? parseFloat(pounds) : pounds;
  
  // Handle NaN
  if (isNaN(numericAmount)) return 0;
  
  // Validate the amount is within reasonable range
  if (!validatePoundsAmount(numericAmount)) {
    console.warn(`[CurrencyService] Suspicious pounds amount: ${numericAmount}`);
  }
  
  // Convert to pence by multiplying by 100 and rounding to avoid floating point issues
  return Math.round(numericAmount * 100);
}

/**
 * Validate an amount in pence/cents
 * 
 * @param pence Amount in pence/cents (integer)
 * @param context Optional context for logging
 * @returns Boolean indicating if the amount is valid
 */
export function validatePenceAmount(
  pence: number | null | undefined,
  context?: string
): boolean {
  if (pence === null || pence === undefined) return false;
  
  const contextText = context ? `[${context}] ` : '';
  
  // Check if amount is suspiciously large
  if (pence > MAX_AMOUNT_PENCE) {
    console.error(`${contextText}Amount in pence (${pence}) exceeds maximum allowed value (${MAX_AMOUNT_PENCE})`);
    return false;
  }
  
  // Check if amount is below minimum
  if (pence < MIN_AMOUNT_PENCE) {
    console.warn(`${contextText}Amount in pence (${pence}) is below minimum value (${MIN_AMOUNT_PENCE})`);
    return false;
  }
  
  // Check if amount might be mistakenly in pounds
  if (pence < 100 && pence > 0) {
    console.warn(`${contextText}Amount (${pence}) seems low for a pence value. Did you mean £${pence}?`);
    // Don't return false here, just warn
  }
  
  return true;
}

/**
 * Validate an amount in pounds/dollars
 * 
 * @param pounds Amount in pounds/dollars (decimal)
 * @param context Optional context for logging
 * @returns Boolean indicating if the amount is valid
 */
export function validatePoundsAmount(
  pounds: number | null | undefined,
  context?: string
): boolean {
  if (pounds === null || pounds === undefined) return false;
  
  const contextText = context ? `[${context}] ` : '';
  
  // Check if amount is suspiciously large
  if (pounds > MAX_AMOUNT_POUNDS) {
    console.error(`${contextText}Amount in pounds (£${pounds}) exceeds maximum allowed value (£${MAX_AMOUNT_POUNDS})`);
    return false;
  }
  
  // Check if amount is below minimum
  if (pounds <= 0) {
    console.warn(`${contextText}Amount in pounds (£${pounds}) is below minimum value (£0.01)`);
    return false;
  }
  
  // Check if amount might be mistakenly in pence
  if (pounds > 10000) {
    console.warn(`${contextText}Amount (£${pounds}) seems high. Is this actually a value in pence?`);
    // Don't return false here, just warn
  }
  
  return true;
}

/**
 * Debug method to log currency information for debugging
 */
export function debugCurrencyInfo(
  amount: number,
  description: string,
  isInPence: boolean = true
): void {
  console.debug(
    `[CURRENCY-DEBUG] ${description}: ` +
    `${isInPence ? amount + 'p' : '£' + amount} ` +
    `(${isInPence ? '£' + penceToPounds(amount) : amount * 100 + 'p'})`
  );
}
