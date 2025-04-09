
import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface VerificationStatusProps {
  status: 'idle' | 'success' | 'error';
  message: string;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({ status, message }) => {
  if (status === 'idle' || !message) {
    return null;
  }

  return (
    <>
      {status === 'success' && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center">
          <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
          <p className="text-green-700 text-sm">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center">
          <AlertCircle className="text-red-500 mr-2 h-5 w-5" />
          <p className="text-red-700 text-sm">{message}</p>
        </div>
      )}
    </>
  );
};
