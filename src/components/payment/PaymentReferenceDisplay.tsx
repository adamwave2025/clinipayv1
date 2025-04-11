
import React from 'react';

interface PaymentReferenceDisplayProps {
  reference: string;
  className?: string;
}

const PaymentReferenceDisplay = ({ reference, className = '' }: PaymentReferenceDisplayProps) => {
  if (!reference) return null;
  
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-sm font-medium text-gray-500">Reference</p>
      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 break-all">
        {reference}
      </p>
    </div>
  );
};

export default PaymentReferenceDisplay;
