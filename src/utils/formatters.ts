
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
  
  // Format with 2 decimal places and the currency symbol
  return `${currency}${convertedAmount.toFixed(2)}`;
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
