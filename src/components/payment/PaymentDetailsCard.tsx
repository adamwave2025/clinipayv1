
import React from 'react';

interface PaymentDetail {
  label: string;
  value: string | number;
  colSpan?: number;
  className?: string;
}

interface PaymentDetailsCardProps {
  details: PaymentDetail[];
  className?: string;
  title?: string;
}

const PaymentDetailsCard = ({ details, className = '', title }: PaymentDetailsCardProps) => {
  return (
    <div className={`bg-gray-50 rounded-lg p-4 mb-6 ${className}`}>
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      
      <div className="grid grid-cols-2 gap-4 text-left">
        {details.map((detail, index) => (
          <div 
            key={index} 
            className={`${detail.colSpan ? `col-span-${detail.colSpan}` : ''} ${detail.className || ''}`}
          >
            <p className="text-sm text-gray-500">{detail.label}</p>
            <p className={`font-medium ${typeof detail.value === 'number' ? 'font-bold' : ''}`}>
              {typeof detail.value === 'number' && !String(detail.value).startsWith('£') ? 
                `£${detail.value.toFixed(2)}` : 
                detail.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentDetailsCard;
