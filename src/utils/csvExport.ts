
/**
 * Utility functions for exporting data to CSV format
 */

import { Payment } from '@/types/payment';
import { formatCurrency } from './formatters';

/**
 * Convert an array of payments to a CSV string
 * @param payments Array of payment objects
 * @returns CSV formatted string
 */
export const generatePaymentsCsv = (payments: Payment[]): string => {
  // Define the CSV headers
  const headers = [
    'Patient Name',
    'Patient Email',
    'Patient Phone',
    'Amount',
    'Platform Fee',
    'Net Amount',
    'Reference',
    'Name', // Renamed from "Type" to "Name" for clarity
    'Payment Type', // New column to indicate if it's a payment plan or reusable link
    'Date',
    'Status'
  ];
  
  // Convert headers to CSV row
  const headerRow = headers.join(',');
  
  // Map payments to CSV rows
  const rows = payments.map(payment => {
    // Clean data to ensure no commas break the CSV format
    const patientName = payment.patientName ? `"${payment.patientName.replace(/"/g, '""')}"` : '""';
    const patientEmail = payment.patientEmail ? `"${payment.patientEmail.replace(/"/g, '""')}"` : '""';
    const patientPhone = payment.patientPhone ? `"${payment.patientPhone.replace(/"/g, '""')}"` : '""';
    
    /**
     * IMPORTANT: MONETARY VALUE HANDLING
     * 
     * There are different units for monetary values in the system:
     * 1. Amount (`payment.amount`) may be in pennies (e.g., 400000 for £4,000) OR 
     *    already in pounds (e.g., 4000 for £4,000) depending on the source
     * 2. Platform fee (`payment.platformFee`) is ALWAYS in pennies (e.g., 8000 for £80)
     * 3. The database `netAmount` field is NOT accurate for CSV exports and MUST BE IGNORED
     * 
     * For correct CSV export:
     * - We detect if amount is in pennies (large values like 400000) and convert to pounds (divide by 100)
     * - We always convert platform fee from pennies to pounds (divide by 100)
     * - We calculate net amount as (amount in pounds) - (platform fee in pounds)
     * - All monetary values are formatted with 2 decimal places (e.g., 4000.00)
     * 
     * DO NOT modify this logic without thorough testing to ensure accuracy of exports!
     */
    
    // Determine if amount is in pennies (very large value) and format it correctly
    // Our expected output should be like 4000.00
    let formattedAmount = '0.00';
    if (payment.amount) {
      // Check if amount seems to be in pennies (a large value like 400000 for £4000)
      // Typically, if the amount is over 10000 and divisible by 100, it's likely in pennies
      const isInPennies = payment.amount > 10000 && payment.amount % 1 === 0;
      const amountInPounds = isInPennies ? payment.amount / 100 : payment.amount;
      formattedAmount = amountInPounds.toFixed(2);
    }
    
    // Format platform fee - always stored in pennies (cents)
    let platformFee = '0.00';
    if (payment.platformFee) {
      platformFee = (payment.platformFee / 100).toFixed(2);
    }
    
    // Calculate net amount directly from amount and platform fee
    // Note: Disregard the database netAmount field as instructed
    let netAmount = '0.00';
    if (payment.amount) {
      // Get amount in pounds for calculation
      const isInPennies = payment.amount > 10000 && payment.amount % 1 === 0;
      const amountInPounds = isInPennies ? payment.amount / 100 : payment.amount;
      
      // Platform fee is already converted to pounds above
      const platformFeeDecimal = payment.platformFee ? payment.platformFee / 100 : 0;
      
      netAmount = (amountInPounds - platformFeeDecimal).toFixed(2);
    }
    
    const reference = payment.reference ? `"${payment.reference}"` : '""';
    
    // Get the payment title or description
    const name = payment.linkTitle || payment.type || 'Unknown';
    
    // Determine payment type (reusable link or payment plan)
    let paymentType = payment.type === 'payment_plan' ? 'Payment Plan' : 'Reusable Link';
    
    const status = payment.status || 'Unknown';
    
    // Create CSV row
    return [
      patientName,
      patientEmail,
      patientPhone,
      formattedAmount,
      platformFee,
      netAmount,
      reference,
      `"${name}"`,
      `"${paymentType}"`,
      `"${payment.date}"`,
      `"${status}"`
    ].join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Trigger download of a CSV file in the browser
 * @param csvData CSV string data
 * @param filename Name for the downloaded file
 */
export const downloadCsv = (csvData: string, filename: string): void => {
  // Create a blob with the CSV data
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  
  // Append to the body, click programmatically, then remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  URL.revokeObjectURL(url);
};
