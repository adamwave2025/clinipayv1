
import React from 'react';

interface PaymentSectionContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const PaymentSectionContainer = ({ title, children, className = '' }: PaymentSectionContainerProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      {children}
    </div>
  );
};

export default PaymentSectionContainer;
