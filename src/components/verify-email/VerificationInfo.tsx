
import React from 'react';
import { Link } from 'react-router-dom';

export const VerificationInfo: React.FC = () => {
  return (
    <>
      <p className="text-sm text-gray-500 mt-6">
        Already verified?{' '}
        <Link to="/sign-in" className="text-blue-600 hover:text-blue-800">
          Sign in
        </Link>
      </p>

      <div className="mt-8 text-xs text-gray-500">
        <p>If you're having trouble with verification:</p>
        <ul className="list-disc list-inside mt-2 text-left">
          <li>Make sure to check your spam/junk folder</li>
          <li>Try resending the verification email</li>
          <li>If problems persist, contact support</li>
        </ul>
      </div>
    </>
  );
};
