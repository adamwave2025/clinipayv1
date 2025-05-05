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
    const amount = payment.amount ? formatCurrency(payment.amount).replace('£', '') : '0.00';
    
    // Format platform fee if available
    let platformFee = '0.00';
    if (payment.platformFee) {
      // The platform fee should already be in cents, so convert to decimal for display
      platformFee = formatCurrency(payment.platformFee / 100).replace('£', '');
    }
    
    // Use the database's net_amount field if available, otherwise calculate it
    let netAmount = '0.00';
    if (payment.netAmount) {
      // If we have a pre-calculated net amount from the database, use that
      netAmount = formatCurrency(payment.netAmount).replace('£', '');
    } else if (payment.amount) {
      // Fallback calculation if netAmount isn't available
      // Convert platform fee from cents to decimal currency unit to match amount
      const platformFeeDecimal = payment.platformFee ? payment.platformFee / 100 : 0;
      netAmount = formatCurrency(payment.amount - platformFeeDecimal).replace('£', '');
    }
    
    const reference = payment.reference ? `"${payment.reference}"` : '""';
    
    // Get the payment title or description
    const name = payment.linkTitle || payment.type || 'Unknown';
    
    // Determine payment type (reusable link, payment plan, or direct)
    let paymentType = 'Direct Payment';
    if (payment.type === 'payment_plan') {
      paymentType = 'Payment Plan';
    } else {
      paymentType = 'Reusable Link';
    }
    
    const status = payment.status || 'Unknown';
    
    // Create CSV row
    return [
      patientName,
      patientEmail,
      patientPhone,
      amount,
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
