
import React from 'react';
import PaymentTableRow from './PaymentTableRow';
import { Payment } from '@/types/payment';

interface PaymentTableProps {
  payments: Payment[];
  onPaymentClick: (payment: Payment) => void;
}

const PaymentTable = ({ payments, onPaymentClick }: PaymentTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="text-left text-sm text-gray-500">
          <tr className="border-b">
            <th className="pb-3 pl-2 pr-3 font-medium">Patient</th>
            <th className="pb-3 px-3 font-medium">Amount</th>
            <th className="pb-3 px-3 font-medium">Type</th>
            <th className="pb-3 px-3 font-medium">Date</th>
            <th className="pb-3 px-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 text-center text-gray-500">
                No payments found
              </td>
            </tr>
          ) : (
            payments.map((payment) => (
              <PaymentTableRow 
                key={payment.id}
                payment={payment}
                onClick={() => onPaymentClick(payment)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTable;
