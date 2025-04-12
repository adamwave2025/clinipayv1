
import React from 'react';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, capitalizeFirstLetter, formatDate } from '@/utils/formatters';
import { Payment } from '@/types/payment';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentTableRowProps {
  payment: Payment;
  onClick: () => void;
}

const PaymentTableRow = ({ payment, onClick }: PaymentTableRowProps) => {
  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (payment.paymentUrl) {
      navigator.clipboard.writeText(payment.paymentUrl);
      // Use browser's built-in alert for simplicity
      alert('Payment link copied to clipboard');
    }
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (payment.paymentUrl) {
      window.open(payment.paymentUrl, '_blank');
    }
  };

  return (
    <tr 
      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <td className="py-4 pl-2 pr-3">
        <div className="font-medium text-gray-900">{payment.patientName}</div>
        {payment.patientEmail && (
          <div className="text-xs text-gray-500">{payment.patientEmail}</div>
        )}
      </td>
      <td className="py-4 px-3 font-medium">
        <div>
          {formatCurrency(payment.amount)}
          {payment.status === 'partially_refunded' && payment.refundedAmount && (
            <div className="text-xs text-blue-600">
              {formatCurrency(payment.refundedAmount)} refunded
            </div>
          )}
          {payment.status === 'refunded' && (
            <div className="text-xs text-blue-600">
              Fully refunded
            </div>
          )}
        </div>
      </td>
      <td className="py-4 px-3 font-mono text-sm text-gray-600">
        {payment.reference || '-'}
      </td>
      <td className="py-4 px-3 text-gray-700">
        {capitalizeFirstLetter(payment.type)}
      </td>
      <td className="py-4 px-3 text-gray-500">
        {formatDate(payment.date)}
      </td>
      <td className="py-4 px-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={payment.status} />
          
          {payment.status === 'sent' && payment.paymentUrl && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopyLink}
                title="Copy payment link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleOpenLink}
                title="Open payment link"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default PaymentTableRow;
