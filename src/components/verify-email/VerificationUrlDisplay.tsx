
import React from 'react';

interface VerificationUrlDisplayProps {
  verificationUrl: string;
}

export const VerificationUrlDisplay: React.FC<VerificationUrlDisplayProps> = ({ verificationUrl }) => {
  if (!verificationUrl) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-medium text-blue-700 mb-2">Verification Link (for testing):</h3>
      <a 
        href={verificationUrl}
        className="text-blue-600 hover:text-blue-800 break-all underline text-sm"
        target="_blank" 
        rel="noopener noreferrer"
      >
        {verificationUrl}
      </a>
      <p className="mt-2 text-xs text-gray-500">
        (This link is shown here for testing purposes only. In production, it would only be sent via email.)
      </p>
    </div>
  );
};
