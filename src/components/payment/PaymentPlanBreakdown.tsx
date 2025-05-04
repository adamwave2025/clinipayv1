
import React from 'react';
import PaymentDetailsCard from './PaymentDetailsCard';
import { formatCurrency } from '@/utils/formatters';
import { AlertCircle } from 'lucide-react';

interface PaymentPlanBreakdownProps {
  planTotalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  isOverdue?: boolean;
}

const PaymentPlanBreakdown = ({ 
  planTotalAmount, 
  totalPaid, 
  totalOutstanding,
  isOverdue
}: PaymentPlanBreakdownProps) => {
  const details = [
    { label: 'Plan Total', value: formatCurrency(planTotalAmount) },
    { label: 'Total Paid', value: formatCurrency(totalPaid) },
    { label: 'Total Outstanding', value: formatCurrency(totalOutstanding) }
  ];

  return (
    <div className="space-y-2">
      {isOverdue && (
        <div className="bg-red-50 border-l-4 border-red-400 p-2 text-sm text-red-700 flex items-start">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment Overdue</p>
            <p className="text-xs">This payment plan has overdue payments. Please contact the clinic if you're having difficulties making payments.</p>
          </div>
        </div>
      )}
      <PaymentDetailsCard 
        details={details} 
        className="bg-gray-50 p-3"
      />
    </div>
  );
};

export default PaymentPlanBreakdown;
