
import React from 'react';
import { LoadingSpinner } from '@/components/ui/spinner';

const PaymentPageLoading = () => {
  return (
    <div className="flex items-center justify-center h-40">
      <LoadingSpinner size="lg" />
      <p className="ml-3 text-gray-600">Loading payment information...</p>
    </div>
  );
};

export default PaymentPageLoading;
