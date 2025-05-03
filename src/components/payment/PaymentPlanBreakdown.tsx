
import React from 'react';
import PaymentDetailsCard from './PaymentDetailsCard';

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
    { label: 'Plan Total', value: planTotalAmount },
    { label: 'Total Paid', value: totalPaid },
    { label: 'Total Outstanding', value: totalOutstanding }
  ];

  return (
    <PaymentDetailsCard 
      details={details} 
      className="mb-2 bg-gray-50 p-3"
    />
  );
};

export default PaymentPlanBreakdown;
