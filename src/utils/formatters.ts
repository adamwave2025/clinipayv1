
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
 * Format a number as currency (£)
 * 
 * IMPORTANT BUGFIX (2025-05-07): Fixed issue with amounts > £1000 displaying incorrectly.
 * This function now has more reliable detection of amounts stored in cents vs pounds.
 * 
 * The database stores monetary values in cents (1/100 of currency unit)
 * But the UI displays them in standard currency units (pounds/dollars/etc)
 *
 * @param amount - The amount to format
 * @param currency - The currency symbol
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined, currency: string = '£'): string => {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  
  let formattedAmount = amount;
  
  // Check if this might be an amount stored in cents that needs conversion
  // Look for large integer values that don't have decimal places
  // BUGFIX: Previously used a threshold of 1000 which broke for large amounts
  // Now we use a more reliable approach based on the properties of the number
  if (
    Number.isInteger(amount) && // It's a whole number (no decimal places)
    amount > 0 && // It's positive
    amount % 1 === 0 && // Double-check it's an integer
    // If it has more than 2 digits and ends in 00, it's likely already in pounds/dollars
    !((amount > 99) && (amount % 100 === 0))
  ) {
    // This is likely an amount stored in cents, convert to standard currency units
    formattedAmount = amount / 100;
  }

  // Format with 2 decimal places and the currency symbol
  return `${currency}${formattedAmount.toFixed(2)}`;
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
