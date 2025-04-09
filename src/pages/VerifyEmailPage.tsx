
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const VerifyEmailPage = () => {
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if we have a token and userId in the URL for verification
  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    
    if (token && userId) {
      handleVerifyToken(token, userId);
    }
  }, [searchParams]);

  // Check for email in URL params or in local storage
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

  // If user is already signed in, navigate to dashboard
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
      console.log("Verifying token:", token, "for user:", userId);
      const response = await supabase.functions.invoke('handle-new-signup', {
        method: 'POST',
        body: { 
          type: 'verify_token',
          token,
          userId
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Error verifying email");
      }
      
      console.log("Verification response:", response.data);
      
      if (response.data?.success) {
        setStatus('success');
        setMessage('Your email has been verified! You can now sign in to your account.');
        toast.success('Email verification successful!');
        
        // Redirect to sign-in page after a short delay
        setTimeout(() => {
          navigate('/sign-in');
        }, 3000);
      } else {
        throw new Error(response.data?.error || "Failed to verify email");
      }
    } catch (error: any) {
      console.error('Error verifying token:', error);
      setStatus('error');
      setMessage(error.message || 'An error occurred during email verification');
      toast.error(error.message || 'An error occurred during email verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    setStatus('idle');
    setMessage('');
    
    try {
      // Call the edge function for resending verification
      console.log("Calling handle-new-signup function for resend email:", email);
      const functionResponse = await supabase.functions.invoke('handle-new-signup', {
        method: 'POST',
        body: { 
          email, 
          id: localStorage.getItem('userId') || undefined, 
          type: 'resend'
        }
      });
      
      if (functionResponse.error) {
        throw new Error(functionResponse.error.message || "Error resending verification");
      }
      
      // If we got a direct verification URL, display it
      if (functionResponse.data?.verificationUrl) {
        setVerificationUrl(functionResponse.data.verificationUrl);
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
    <AuthLayout 
      title="Verify your email"
      subtitle="We've sent a verification link to your email"
    >
      <div className="text-center">
        {isVerifying ? (
          <div className="flex flex-col items-center justify-center my-8">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-gray-600">Verifying your email...</p>
          </div>
        ) : (
          <div className="flex justify-center my-8">
            <div className="bg-blue-50 rounded-full p-6">
              <Mail className="h-12 w-12 text-blue-500" />
            </div>
          </div>
        )}
        
        <p className="mb-6 text-gray-600">
          Please check your inbox and click on the verification link to complete your registration.
          If you don't see the email, check your spam folder.
        </p>

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
        
        {/* If verification URL is available, show it */}
        {verificationUrl && (
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
        )}
        
        {!isVerifying && (
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
        )}
        
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
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
