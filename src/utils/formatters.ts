import { format } from 'date-fns';

/**
 * Format a date to a standard string format
 * Uses format from date-fns
 * @param date - The date to format
 * @param formatString - Optional format string
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | null, formatString: string = 'dd/MM/yyyy'): string => {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Format a date with time
 * @param date - The date to format
 * @param locale - Optional locale
 * @param timeZone - Optional timezone
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: string | Date | null, 
  locale: string = 'en-US',
  timeZone?: string
): string => {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    if (timeZone) {
      options.timeZone = timeZone;
    }
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date time:', error);
    return String(date);
  }
};

/**
 * CURRENCY FORMATTING GUIDE:
 * 
 * 1. For database values (stored in pence/cents):
 *    - Use formatCurrency(amount)
 *    - This DIVIDES by 100 to convert pence to pounds
 *    - Example: formatCurrency(1000) => "£10.00"
 * 
 * 2. For user input or already converted values (already in pounds/dollars):
 *    - Use formatUserInputCurrency(amount)
 *    - This does NOT divide by 100
 *    - Example: formatUserInputCurrency(10) => "£10.00"
 * 
 * 3. When in doubt, check the origin of your data:
 *    - Values from API/database => formatCurrency()
 *    - Values from user input/calculations => formatUserInputCurrency()
 */

/**
 * Format a number as currency (£)
 * 
 * IMPORTANT: This function assumes all monetary values are stored in pence/cents (1/100 of currency unit)
 * and ALWAYS divides the input amount by 100 to convert to standard currency units (pounds/dollars/etc.)
 *
 * @param amount - The amount in pence/cents to format
 * @param currency - The currency symbol
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined, currency: string = '£'): string => {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  
  // Always convert from pence/cents to pounds/dollars by dividing by 100
  const convertedAmount = amount / 100;
  
  // Check if the amount is suspiciously large (might indicate a conversion error)
  if (convertedAmount > 1000000) {
    console.warn(`[Currency Warning] Very large amount detected: ${currency}${convertedAmount.toFixed(2)}. This might be a conversion error.`);
  }
  
  // Format with 2 decimal places and the currency symbol
  return `${currency}${convertedAmount.toFixed(2)}`;
};

/**
 * Format a number as currency (£) WITHOUT dividing by 100
 * 
 * IMPORTANT: This formatter is specifically for values that are ALREADY in standard currency units (pounds/dollars/etc.)
 * such as user input values. It does NOT divide by 100 like the regular formatCurrency function.
 * 
 * Use this function ONLY for displaying user input amounts or calculated values that are already in pounds/dollars,
 * NOT for values from the database (which are stored in pence/cents).
 *
 * @param amount - The amount in standard currency units (pounds/dollars/etc.)
 * @param currency - The currency symbol
 * @returns Formatted currency string
 */
export const formatUserInputCurrency = (amount: number | string | null | undefined, currency: string = '£'): string => {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number
  if (isNaN(numericAmount)) return `${currency}0.00`;
  
  // Check if the amount is suspiciously large (might indicate a conversion error)
  if (numericAmount > 1000000) {
    console.warn(`[Currency Warning] Very large amount detected in user input currency: ${currency}${numericAmount.toFixed(2)}. This might be an error.`);
  }
  
  // Format with 2 decimal places and the currency symbol - without dividing by 100
  return `${currency}${numericAmount.toFixed(2)}`;
};

/**
 * Validate a monetary amount for potential errors
 * This function logs warnings for potentially incorrect monetary values
 * 
 * @param amount - The amount to validate
 * @param context - Description of where this validation is happening
 * @param isInPence - Whether the amount is expected to be in pence (true) or pounds (false)
 * @returns boolean indicating if the amount seems valid
 */
export const validateMonetaryAmount = (
  amount: number | null | undefined, 
  context: string,
  isInPence: boolean = true
): boolean => {
  if (amount === null || amount === undefined) return false;
  
  // Define reasonable limits based on whether we expect pence or pounds
  const minValue = isInPence ? 1 : 0.01; // 1p or £0.01
  const maxValue = isInPence ? 1000000000 : 10000000; // £10M in pence or pounds
  
  // For values in pence, check if they're suspiciously low (might be mistakenly in pounds)
  if (isInPence && amount < 100 && amount > 0) {
    console.warn(`[Currency Warning] ${context}: Amount ${amount} seems low for a pence value. Did you mean £${amount}?`);
  }
  
  // For values in pounds, check if they're suspiciously high (might be mistakenly in pence)
  if (!isInPence && amount > 10000) {
    console.warn(`[Currency Warning] ${context}: Amount £${amount} seems high. Is this actually a value in pence?`);
  }
  
  // Check if amount is within reasonable range
  if (amount < minValue || amount > maxValue) {
    console.warn(`[Currency Warning] ${context}: Amount ${isInPence ? amount + 'p' : '£' + amount} is outside normal range.`);
    return false;
  }
  
  return true;
};

/**
 * Format a number as a percentage
 * @param value - The percentage value
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0%';
  return `${Math.round(value)}%`;
};

/**
 * Format a phone number with spaces
 * @param phone - The phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 11) { // UK format
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  } else if (cleaned.length === 10) { // US format
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  // Just add spaces every 4 digits if we don't recognize the format
  return cleaned.replace(/(\d{4})/g, '$1 ').trim();
};

/**
 * Capitalize the first letter of a string
 * @param text - The input string
 * @returns String with first letter capitalized
 */
export const capitalizeFirstLetter = (text: string): string => {
  if (!text || text.length === 0) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};
