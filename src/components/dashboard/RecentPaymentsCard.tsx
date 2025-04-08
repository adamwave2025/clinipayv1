
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '../common/StatusBadge';

export interface Payment {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  date: string;
  status: 'paid' | 'refunded' | 'pending' | 'failed';
  type: 'deposit' | 'treatment' | 'consultation' | 'other';
}

interface RecentPaymentsCardProps {
  payments: Payment[];
  onRefund: (paymentId: string) => void;
  onPaymentClick: (payment: Payment) => void;
}

const RecentPaymentsCard = ({ payments, onRefund, onPaymentClick }: RecentPaymentsCardProps) => {
  // Capitalize first letter of payment type
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <Card className="card-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Manage your recent payments</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
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
                  <tr 
                    key={payment.id} 
                    className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onPaymentClick(payment)}
                  >
                    <td className="py-4 pl-2 pr-3">
                      <div className="font-medium text-gray-900">{payment.patientName}</div>
                    </td>
                    <td className="py-4 px-3 font-medium">
                      £{payment.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-3 text-gray-700">
                      {capitalizeFirstLetter(payment.type)}
                    </td>
                    <td className="py-4 px-3 text-gray-500">
                      {payment.date}
                    </td>
                    <td className="py-4 px-3">
                      <StatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentPaymentsCard;
