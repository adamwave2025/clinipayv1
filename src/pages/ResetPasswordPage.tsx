
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthLayout from '@/components/layouts/AuthLayout';
import TokenVerifier from '@/components/reset-password/TokenVerifier';
import ResetPasswordForm from '@/components/reset-password/ResetPasswordForm';

const ResetPasswordPage = () => {
  const location = useLocation();
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verifiedData, setVerifiedData] = useState<{userId: string, token: string} | null>(null);

  // Get token and userId from query parameters
  const searchParams = new URLSearchParams(location.search);
  const tokenParam = searchParams.get('token');
  const userIdParam = searchParams.get('userId');

  const handleVerified = (userId: string, token: string) => {
    setVerifiedData({ userId, token });
    setVerificationComplete(true);
  };

  return (
    <AuthLayout 
      title={verificationComplete ? "Set new password" : "Verifying your request"} 
      subtitle={verificationComplete 
        ? "Create a new password for your account" 
        : "Please wait while we verify your reset link..."}
    >
      {!verificationComplete ? (
        <TokenVerifier 
          token={tokenParam} 
          userId={userIdParam} 
          onVerified={handleVerified} 
        />
      ) : verifiedData && (
        <ResetPasswordForm 
          userId={verifiedData.userId} 
          token={verifiedData.token} 
        />
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage;
