
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
    'Reference',
    'Type',
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
    const platformFee = payment.platformFee 
      ? formatCurrency(payment.platformFee).replace('£', '') 
      : '0.00';
    
    const reference = payment.reference ? `"${payment.reference}"` : '""';
    const type = payment.linkTitle || payment.type || 'Unknown';
    const status = payment.status || 'Unknown';
    
    // Create CSV row
    return [
      patientName,
      patientEmail,
      patientPhone,
      amount,
      platformFee,
      reference,
      `"${type}"`,
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

