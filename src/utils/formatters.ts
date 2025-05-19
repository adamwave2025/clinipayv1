
import { format } from 'date-fns';
import { 
  penceToPounds, 
  poundsToPence,
  validatePenceAmount,
  validatePoundsAmount
} from '@/services/CurrencyService';

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
 * @param locale - Optional locale (default: 'en-GB' for UK format)
 * @param timeZone - Optional timezone (default: 'Europe/London' for UK time)
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: string | Date | null, 
  locale: string = 'en-GB',
  timeZone: string = 'Europe/London'
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
      hour12: true,
      timeZone: timeZone
    };
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date time:', error, date);
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
 * Always shows 2 decimal places even for whole numbers.
 *
 * @param amount - The amount in pence/cents to format
 * @param currency - The currency symbol
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined, currency: string = '£'): string => {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  
  // Validate the amount for debugging
  validatePenceAmount(amount, 'formatCurrency');
  
  // Convert from pence to pounds
  const convertedAmount = penceToPounds(amount);
  
  // Format with 2 decimal places and the currency symbol
  return `${currency}${convertedAmount.toFixed(2)}`;
};

/**
 * Format a number as currency (£) WITHOUT dividing by 100
 * 
 * IMPORTANT: This formatter is specifically for values that are ALREADY in standard currency units (pounds/dollars/etc.)
 * such as user input values. It does NOT divide by 100 like the regular formatCurrency function.
 * Always shows 2 decimal places even for whole numbers.
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
  
  // Validate the amount for debugging
  validatePoundsAmount(numericAmount, 'formatUserInputCurrency');
  
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
  if (isInPence) {
    return validatePenceAmount(amount, context);
  } else {
    return validatePoundsAmount(amount, context);
  }
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
