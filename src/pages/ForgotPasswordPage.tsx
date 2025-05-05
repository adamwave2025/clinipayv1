
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/layouts/AuthLayout';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { requestPasswordReset } from '@/utils/password-reset';
import { AlertCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await requestPasswordReset(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send reset instructions');
      }
      
      setIsSubmitted(true);
      // Removed toast notification here as requested
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      setError(error.message || 'Failed to send reset instructions. Please try again.');
      toast.error(error.message || 'Failed to send reset instructions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Reset your password" 
      subtitle="Enter your email to receive reset instructions"
    >
      {isSubmitted ? (
        <div className="text-center py-6 space-y-4">
          <div className="bg-green-50 text-green-800 p-4 rounded-md">
            <p>If an account exists for <strong>{email}</strong>, check your email and follow the link to reset your password.</p>
            <p className="text-sm mt-2">Please check your email inbox and spam folder for instructions.</p>
          </div>
          <p className="text-gray-600 mt-4">
            Didn't receive an email? {' '}
            <button 
              onClick={() => setIsSubmitted(false)} 
              className="text-blue-600 hover:underline"
            >
              try again
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="text-red-500 mr-2 h-5 w-5 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="w-full input-focus"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full btn-gradient"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Send Reset Instructions
          </Button>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/sign-in" className="text-blue-600 hover:text-blue-800">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
