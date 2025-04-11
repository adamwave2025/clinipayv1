
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/layouts/AuthLayout';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  // Check for token in URL or session storage when component mounts
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // We'll check if there is an access_token in the URL
        // The actual token is handled by Supabase
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (!accessToken) {
          console.error('No access token found in URL hash');
          setError('Invalid or missing reset token. Please request a new password reset link.');
          setVerifying(false);
          return;
        }
        
        console.log('Found access token in URL hash, validation successful');
        
        // If we have a token, the Supabase client will automatically handle it
        setVerifying(false);
      } catch (err) {
        console.error('Error verifying reset token:', err);
        setError('Unable to verify your reset token. Please request a new password reset link.');
        setVerifying(false);
      }
    };
    
    checkAccess();
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Attempting to update password');
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });
      
      if (error) {
        console.error('Error updating password:', error);
        throw error;
      }
      
      console.log('Password updated successfully');
      toast.success('Password updated successfully');
      
      // Redirect to sign-in page after short delay
      setTimeout(() => {
        navigate('/sign-in');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password. Please try again.');
      toast.error(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthLayout 
        title="Verifying your request" 
        subtitle="Please wait while we verify your reset link..."
      >
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </AuthLayout>
    );
  }

  if (error && error.includes('Invalid or missing reset token')) {
    return (
      <AuthLayout 
        title="Invalid Reset Link" 
        subtitle="We couldn't verify your password reset link"
      >
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
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Set new password" 
      subtitle="Create a new password for your account"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="text-red-500 mr-2 h-5 w-5 mt-0.5" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full input-focus"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
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
          Update Password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
