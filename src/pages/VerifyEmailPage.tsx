import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AuthLayout from '@/components/layouts/AuthLayout';
import { verifyEmailToken } from '@/utils/auth-utils';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

import { EmailIcon } from '@/components/verify-email/EmailIcon';
import { VerifyingEmail } from '@/components/verify-email/VerifyingEmail';
import { VerificationStatus } from '@/components/verify-email/VerificationStatus';
import { VerificationForm } from '@/components/verify-email/VerificationForm';
import { VerificationInfo } from '@/components/verify-email/VerificationInfo';

const VerifyEmailPage = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasConsent } = useCookieConsent();
  
  // Fire Meta Pixel CompleteRegistration event on page load
  useEffect(() => {
    if (hasConsent && window.fbq) {
      console.log('[META PIXEL] Firing CompleteRegistration event on verify-email page');
      window.fbq('track', 'CompleteRegistration');
    }
  }, [hasConsent]);
  
  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    
    if (token && userId) {
      handleVerifyToken(token, userId);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('verificationEmail', emailParam);
    } else {
      const storedEmail = localStorage.getItem('verificationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [location]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/dashboard');
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleVerifyToken = async (token: string, userId: string) => {
    setIsVerifying(true);
    setStatus('idle');
    setMessage('');
    
    try {
      console.log('Verifying token:', token, 'for userId:', userId);
      const result = await verifyEmailToken(token, userId);
      
      if (!result.success) {
        throw new Error(result.error || "Invalid verification token");
      }
      
      toast.success('Email verification successful! You can now sign in.');
      
      navigate('/sign-in');
      return;
    } catch (error: any) {
      console.error('Error verifying token:', error);
      setStatus('error');
      setMessage(error.message || 'An error occurred during email verification');
      toast.error(error.message || 'An error occurred during email verification');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AuthLayout 
      title="Verify your email"
      subtitle="We've sent a verification link to your email"
    >
      <div className="text-center">
        {isVerifying ? (
          <VerifyingEmail />
        ) : (
          <EmailIcon />
        )}
        
        <p className="mb-6 text-gray-600">
          Please check your inbox and click on the verification link to complete your registration.
          If you don't see the email, check your spam folder.
        </p>

        <VerificationStatus status={status} message={message} />
        
        {!isVerifying && (
          <VerificationForm 
            email={email}
            setEmail={setEmail}
            setStatus={setStatus}
            setMessage={setMessage}
            setVerificationUrl={setVerificationUrl}
          />
        )}
        
        <VerificationInfo />
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
