
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentTable from './payments/PaymentTable';
import { Payment } from '@/types/payment';

interface RecentPaymentsCardProps {
  payments: Payment[];
  onRefund: (paymentId: string) => void;
  onPaymentClick: (payment: Payment) => void;
}

const RecentPaymentsCard = ({ payments, onRefund, onPaymentClick }: RecentPaymentsCardProps) => {
  return (
    <Card className="card-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Manage your recent payments</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <PaymentTable 
          payments={payments}
          onPaymentClick={onPaymentClick}
        />
      </CardContent>
    </Card>
  );
};

export default RecentPaymentsCard;
