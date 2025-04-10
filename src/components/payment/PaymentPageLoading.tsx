
import React from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const PaymentPageLoading = () => {
  return (
    <PaymentLayout isSplitView={false} hideHeaderFooter={false}>
      <div className="flex items-center justify-center h-40">
        <LoadingSpinner size="lg" />
        <p className="ml-3 text-gray-600">Loading payment information...</p>
      </div>
    </PaymentLayout>
  );
};

export default PaymentPageLoading;
