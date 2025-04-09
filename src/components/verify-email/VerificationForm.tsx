
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { sendVerificationEmail } from '@/utils/auth-utils';
import { toast } from 'sonner';

interface VerificationFormProps {
  email: string;
  setEmail: (email: string) => void;
  setStatus: (status: 'idle' | 'success' | 'error') => void;
  setMessage: (message: string) => void;
  setVerificationUrl: (url: string) => void;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  email,
  setEmail,
  setStatus,
  setMessage,
  setVerificationUrl
}) => {
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    setStatus('idle');
    setMessage('');
    
    try {
      const result = await sendVerificationEmail(
        email, 
        localStorage.getItem('userId') || undefined
      );
      
      if (!result.success) {
        throw new Error(result.error || "Failed to resend verification email");
      }
      
      // If we got a direct verification URL, display it
      if (result.verificationUrl) {
        setVerificationUrl(result.verificationUrl);
      }
      
      setStatus('success');
      setMessage('Verification email has been resent. Please check your inbox.');
      localStorage.setItem('verificationEmail', email);
      toast.success('Verification email has been resent.');
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      setStatus('error');
      setMessage(error.message || 'An error occurred while resending the verification email');
      toast.error(error.message || 'An error occurred while resending the verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      <Button 
        variant="outline" 
        onClick={handleResendEmail}
        disabled={isResending}
        className="w-full"
      >
        {isResending ? <LoadingSpinner size="sm" className="mr-2" /> : null}
        Resend verification email
      </Button>
    </div>
  );
};
