
import React from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export const VerifyingEmail: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-8">
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-gray-600">Verifying your email...</p>
    </div>
  );
};
