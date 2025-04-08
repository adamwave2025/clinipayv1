
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const VerifyEmailPage = () => {
  const handleResendEmail = () => {
    toast.success('Verification email has been resent.');
  };

  return (
    <AuthLayout 
      title="Verify your email"
      subtitle="We've sent a verification link to your email"
    >
      <div className="text-center">
        <div className="flex justify-center my-8">
          <div className="bg-blue-50 rounded-full p-6">
            <Mail className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        
        <p className="mb-6 text-gray-600">
          Please check your inbox and click on the verification link to complete your registration.
          If you don't see the email, check your spam folder.
        </p>
        
        <Button 
          variant="outline" 
          onClick={handleResendEmail}
          className="mb-4 w-full"
        >
          Resend verification email
        </Button>
        
        <p className="text-sm text-gray-500 mt-6">
          Already verified?{' '}
          <Link to="/sign-in" className="text-blue-600 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
