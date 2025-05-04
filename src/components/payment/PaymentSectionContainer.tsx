
import React from 'react';

interface PaymentSectionContainerProps {
  title: string;
  children: React.ReactNode;
}

const PaymentSectionContainer: React.FC<PaymentSectionContainerProps> = ({ 
  title, 
  children 
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
        <h3 className="text-md font-medium text-gray-700">{title}</h3>
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  );
};

export default PaymentSectionContainer;
