
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '../common/StatusBadge';
import { RefreshCcw } from 'lucide-react';

export interface Payment {
  id: string;
  patientName: string;
  amount: number;
  date: string;
  status: 'paid' | 'refunded' | 'pending' | 'failed';
}

interface RecentPaymentsCardProps {
  payments: Payment[];
  onRefund: (paymentId: string) => void;
}

const RecentPaymentsCard = ({ payments, onRefund }: RecentPaymentsCardProps) => {
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
                <th className="pb-3 px-3 font-medium">Date</th>
                <th className="pb-3 px-3 font-medium">Status</th>
                <th className="pb-3 px-3 font-medium">Action</th>
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
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 pl-2 pr-3">
                      <div className="font-medium text-gray-900">{payment.patientName}</div>
                    </td>
                    <td className="py-4 px-3 font-medium">
                      £{payment.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-3 text-gray-500">
                      {payment.date}
                    </td>
                    <td className="py-4 px-3">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="py-4 px-3">
                      {payment.status === 'paid' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onRefund(payment.id)}
                          className="flex items-center"
                        >
                          <RefreshCcw className="mr-1 h-3 w-3" />
                          Refund
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
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
