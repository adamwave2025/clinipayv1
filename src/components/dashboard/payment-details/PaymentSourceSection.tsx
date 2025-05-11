
import React from 'react';
import { LinkIcon } from 'lucide-react';
import { Payment } from '@/types/payment';

interface PaymentSourceSectionProps {
  payment: Payment;
}

const PaymentSourceSection = ({ payment }: PaymentSourceSectionProps) => {
  // Determine if this is a payment plan or a regular payment link
  const isPaymentPlan = payment.type === 'payment_plan';
  const isManualPayment = payment.manualPayment === true;
  const sourceType = isManualPayment ? 'Manual Payment' : 
                     isPaymentPlan ? 'Payment Plan' : 'Reusable Link';
  
  console.log('Payment in PaymentSourceSection:', payment);
  console.log('Payment type:', payment.type);
  console.log('Is payment plan?', isPaymentPlan);
  console.log('Is manual payment?', isManualPayment);
  
  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-1">Payment Source: {sourceType}</h4>
      
      {/* Show payment link title prominently if available */}
      {payment.linkTitle && !isManualPayment && (
        <div className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          {payment.isCustomAmount ? (
            'Custom Payment Request'
          ) : (
            <>
              <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
              {payment.linkTitle}
            </>
          )}
        </div>
      )}
      
      {/* For manual payments, show a clear indicator */}
      {isManualPayment && (
        <div className="text-lg font-semibold text-gray-900 mb-2">
          Recorded manually by staff
        </div>
      )}
      
      {/* Payment link description */}
      {payment.description && (
        <div className="text-sm text-gray-600 mb-3">{payment.description}</div>
      )}
    </div>
  );
};

export default PaymentSourceSection;
