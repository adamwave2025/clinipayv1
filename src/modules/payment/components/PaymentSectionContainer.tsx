
import React from 'react';

interface PaymentSectionContainerProps {
  title: string;
  children: React.ReactNode;
}

const PaymentSectionContainer = ({ title, children }: PaymentSectionContainerProps) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
};

export default PaymentSectionContainer;
