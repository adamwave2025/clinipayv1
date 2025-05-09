
/**
 * Currency utility service for handling pence/pounds conversions and validation
 */

/**
 * Convert amount from pounds to pence (multiply by 100)
 * @param pounds Amount in pounds (decimal)
 * @returns Amount in pence (integer)
 */
export const poundsToPence = (pounds: number): number => {
  return Math.round(pounds * 100);
};

/**
 * Convert amount from pence to pounds (divide by 100)
 * @param pence Amount in pence (integer)
 * @returns Amount in pounds (decimal)
 */
export const penceToPounds = (pence: number): number => {
  return pence / 100;
};

/**
 * Validate that an amount is a valid pence value
 * @param penceAmount Amount in pence to validate
 * @param source Optional source identifier for logging
 * @returns Boolean indicating if amount is valid
 */
export const validatePenceAmount = (penceAmount: number, source?: string): boolean => {
  if (penceAmount === undefined || penceAmount === null) {
    console.error(`${source || 'CurrencyService'}: Invalid pence amount - undefined or null`);
    return false;
  }

  if (isNaN(penceAmount)) {
    console.error(`${source || 'CurrencyService'}: Invalid pence amount - not a number: ${penceAmount}`);
    return false;
  }

  if (penceAmount < 0) {
    console.error(`${source || 'CurrencyService'}: Invalid pence amount - negative: ${penceAmount}`);
    return false;
  }

  return true;
};
