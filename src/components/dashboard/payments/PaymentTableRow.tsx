
import React from 'react';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, capitalizeFirstLetter, formatDate } from '@/utils/formatters';
import { Payment } from '@/types/payment';
import { LinkIcon } from 'lucide-react';

interface PaymentTableRowProps {
  payment: Payment;
  onClick: () => void;
}

const PaymentTableRow = ({ payment, onClick }: PaymentTableRowProps) => {
  return (
    <tr 
      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <td className="py-4 pl-2 pr-3">
        <div className="font-medium text-gray-900 truncate max-w-[180px]">{payment.patientName}</div>
        {payment.patientEmail && (
          <div className="text-xs text-gray-500 truncate max-w-[180px]">{payment.patientEmail}</div>
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
      <td className="py-4 px-3 font-mono text-sm text-gray-600 truncate max-w-[140px]">
        {payment.reference || '-'}
      </td>
      <td className="py-4 px-3 text-gray-700 truncate max-w-[140px]">
        {payment.linkTitle ? (
          <div className="flex items-center">
            {!payment.isCustomAmount && <LinkIcon className="h-3 w-3 mr-1 text-blue-500" />}
            <span className="truncate">{payment.linkTitle}</span>
          </div>
        ) : (
          capitalizeFirstLetter(payment.type)
        )}
      </td>
      <td className="py-4 px-3 text-gray-500">
        {payment.date}
      </td>
      <td className="py-4 px-3">
        <StatusBadge status={payment.status} manualPayment={payment.manualPayment} />
      </td>
    </tr>
  );
};

export default PaymentTableRow;
