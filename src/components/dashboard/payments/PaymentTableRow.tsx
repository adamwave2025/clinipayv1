
import React from 'react';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, capitalizeFirstLetter, formatDate } from '@/utils/formatters';
import { Payment } from '@/types/payment';

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
        <div className="font-medium text-gray-900">{payment.patientName}</div>
      </td>
      <td className="py-4 px-3 font-medium">
        {formatCurrency(payment.amount)}
      </td>
      <td className="py-4 px-3 text-gray-700">
        {capitalizeFirstLetter(payment.type)}
      </td>
      <td className="py-4 px-3 text-gray-500">
        {formatDate(payment.date)}
      </td>
      <td className="py-4 px-3">
        <StatusBadge status={payment.status} />
      </td>
    </tr>
  );
};

export default PaymentTableRow;
