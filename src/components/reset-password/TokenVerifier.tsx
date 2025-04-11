
import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { verifyResetToken } from '@/utils/password-reset';

interface TokenVerifierProps {
  token: string | null;
  userId: string | null;
  onVerified: (userId: string, token: string) => void;
}

const TokenVerifier: React.FC<TokenVerifierProps> = ({ token, userId, onVerified }) => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        if (!token || !userId) {
          setError('Invalid or missing reset token. Please request a new password reset link.');
          setVerifying(false);
          return;
        }
        
        const result = await verifyResetToken(token, userId);
        
        if (!result.isValid) {
          setError(result.error || 'Invalid reset token. Please request a new password reset link.');
          setVerifying(false);
          return;
        }
        
        onVerified(userId, token);
        setVerifying(false);
      } catch (err) {
        console.error('Error verifying reset token:', err);
        setError('Unable to verify your reset token. Please request a new password reset link.');
        setVerifying(false);
      }
    };
    
    checkToken();
  }, [token, userId, onVerified]);

  if (verifying) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start mb-6">
          <AlertCircle className="text-red-500 mr-2 h-5 w-5 mt-0.5" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
        
        <div className="text-center">
          <p className="mb-4">Please request a new password reset link.</p>
          <Button 
            onClick={() => navigate('/forgot-password')}
            className="btn-gradient"
          >
            Go to Forgot Password
          </Button>
        </div>
      </div>
    );
  }

  // If there's no error and not verifying, the component
  // will render nothing as onVerified will have been called
  return null;
};

export default TokenVerifier;
