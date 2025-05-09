
/**
 * Service for handling currency-related operations
 */
export const penceToPounds = (pence: number): number => {
  return pence / 100;
};

export const poundsToPence = (pounds: number): number => {
  return Math.round(pounds * 100);
};

export const formatCurrency = (amount: number | string, currency: string = 'GBP'): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    console.error('Invalid amount passed to formatCurrency:', amount);
    return '£0.00';
  }
  
  // Format the currency based on locale and currency code
  let formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  // Determine if we're formatting pence or pounds
  // If the amount is large (over 10000), we assume it's in pence
  if (numericAmount > 10000) {
    return formatter.format(numericAmount / 100);
  }
  
  return formatter.format(numericAmount);
};

/**
 * Validates that an amount in pence is a valid number
 * @param pence Amount in pence
 * @param source Source function name for logging
 * @returns Boolean indicating if the amount is valid
 */
export const validatePenceAmount = (pence: any, source: string = 'unknown'): boolean => {
  // Check if it's a number
  if (typeof pence !== 'number') {
    console.error(`${source}: Amount is not a number:`, pence);
    return false;
  }
  
  // Check if it's NaN or Infinity
  if (isNaN(pence) || !isFinite(pence)) {
    console.error(`${source}: Amount is NaN or Infinity:`, pence);
    return false;
  }
  
  // Check if it's negative
  if (pence < 0) {
    console.error(`${source}: Amount is negative:`, pence);
    return false;
  }
  
  return true;
};
