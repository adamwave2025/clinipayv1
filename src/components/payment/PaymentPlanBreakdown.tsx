
import React from 'react';
import PaymentDetailsCard from './PaymentDetailsCard';
import { formatCurrency } from '@/utils/formatters';

interface PaymentPlanBreakdownProps {
  planTotalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

const PaymentPlanBreakdown = ({ 
  planTotalAmount, 
  totalPaid, 
  totalOutstanding 
}: PaymentPlanBreakdownProps) => {
  const details = [
    { label: 'Plan Total', value: formatCurrency(planTotalAmount) },
    { label: 'Total Paid', value: formatCurrency(totalPaid) },
    { label: 'Total Outstanding', value: formatCurrency(totalOutstanding) }
  ];

  return (
    <PaymentDetailsCard 
      details={details} 
      className="mb-2 bg-gray-50 p-3"
    />
  );
};

export default PaymentPlanBreakdown;
