
/**
 * Formats a numeric amount as a currency with the proper symbol and decimal places
 * @param amount - The numeric amount to format
 * @param currency - The currency symbol to use (defaults to '£')
 * @param decimals - Number of decimal places (defaults to 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | undefined | null, currency: string = '£', decimals: number = 2): string => {
  // Return a dash for undefined or null amounts
  if (amount === undefined || amount === null) {
    return `${currency}0.00`;
  }
  return `${currency}${amount.toFixed(decimals)}`;
};

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns String with first letter capitalized
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Formats a date string into a standardized display format
 * @param dateString - ISO date string or date object
 * @param locales - Locale for formatting (defaults to 'en-GB')
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | Date, locales: string = 'en-GB'): string => {
  if (!dateString) return 'N/A';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString(locales);
};
