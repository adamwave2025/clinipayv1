
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentStatusSummary from '@/components/payment/PaymentStatusSummary';
import { RefreshCcw } from 'lucide-react';

const PaymentFailedPage = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    // Go back to the payment page
    navigate('/payment');
  };

  return (
    <PaymentLayout>
      <PaymentStatusSummary
        status="failed"
        title="Payment Failed"
        description="Your payment could not be processed. Please check your payment details and try again."
        primaryActionLabel={
          <>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </>
        }
        secondaryActionLabel="Close"
        onPrimaryAction={handleTryAgain}
        onSecondaryAction={() => window.close()}
      />
      
      <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
        <h3 className="font-medium text-red-800 mb-2">Possible reasons:</h3>
        <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
          <li>Insufficient funds in your account</li>
          <li>Card details entered incorrectly</li>
          <li>Card has expired or been cancelled</li>
          <li>Transaction was declined by your bank</li>
          <li>Temporary issue with payment processor</li>
        </ul>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          If you continue to experience issues, please contact the clinic directly.
        </p>
      </div>
    </PaymentLayout>
  );
};

export default PaymentFailedPage;
