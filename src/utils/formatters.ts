
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
  
  // Ensure we're dividing by 100 if the amount is stored in cents
  // Our database stores monetary values in cents (1/100 of currency unit)
  const formattedAmount = amount / 100;
  return `${currency}${formattedAmount.toFixed(decimals)}`;
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

/**
 * Formats a date string into a standardized display format including time
 * @param dateString - ISO date string or date object
 * @param locales - Locale for formatting (defaults to 'en-GB')
 * @param timeZone - Optional timezone (defaults to browser's local timezone)
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  dateString: string | Date, 
  locales: string = 'en-GB', 
  timeZone?: string
): string => {
  if (!dateString) return 'N/A';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Use Intl.DateTimeFormat for more consistent formatting with timezone support
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone
  };
  
  const formattedDate = new Intl.DateTimeFormat(locales, dateOptions).format(date);
  const formattedTime = new Intl.DateTimeFormat(locales, timeOptions).format(date);
  
  return `${formattedDate} ${formattedTime}`;
};

/**
 * Converts a display amount (decimal) to cents for database storage
 * @param amount - Amount as decimal string or number (e.g., "100.50" or 100.50)
 * @returns Integer amount in cents (e.g., 10050)
 */
export const amountToCents = (amount: string | number): number => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(value * 100);
};

/**
 * Converts an amount in cents to a display decimal value
 * @param cents - Amount in cents (e.g., 10050)
 * @returns Decimal amount (e.g., 100.50)
 */
export const centsToAmount = (cents: number): number => {
  return cents / 100;
};
