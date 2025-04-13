
import React from 'react';
import { formatCurrency } from '@/utils/formatters';

interface RefundDetailsSectionProps {
  status: string;
  refundedAmount?: number;
  totalAmount: number;
}

const RefundDetailsSection = ({ status, refundedAmount, totalAmount }: RefundDetailsSectionProps) => {
  if (
    (status !== 'partially_refunded' && status !== 'refunded') || 
    refundedAmount === undefined
  ) {
    return null;
  }
  
  return (
    <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-200">
      <h4 className="text-sm font-medium text-blue-700 mb-2">Refund Details</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Refunded Amount:</span>
        </div>
        <div>
          <span className="font-medium">
            {formatCurrency(refundedAmount)}
          </span>
        </div>
        
        {status === 'partially_refunded' && (
          <>
            <div>
              <span className="text-gray-600">Remaining Amount:</span>
            </div>
            <div>
              <span className="font-medium">
                {formatCurrency(totalAmount - refundedAmount)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RefundDetailsSection;
