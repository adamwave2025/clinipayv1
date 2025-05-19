
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AuthLayout from '@/components/layouts/AuthLayout';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { AlertCircle } from 'lucide-react';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp } = useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clinicName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSignupError(null); // Clear any errors when user changes input
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, agreeTerms: checked }));
    setSignupError(null); // Clear any errors when user changes input
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    
    // Simple validation
    if (!formData.clinicName || !formData.email || !formData.password || !formData.confirmPassword) {
      setSignupError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setSignupError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    
    if (!formData.agreeTerms) {
      setSignupError('You must agree to the terms and conditions');
      toast.error('You must agree to the terms and conditions');
      return;
    }
    
    setIsLoading(true);
    console.log('Starting sign up process...', { email: formData.email, clinicName: formData.clinicName });
    
    try {
      const { error, verificationSent } = await signUp(
        formData.email, 
        formData.password, 
        formData.clinicName
      );
      
      if (error) {
        console.error('Sign up error:', error);

        // Improved error handling with specific user messages
        if (error.message) {
          if (error.message.includes('already exists') || error.message.includes('already registered')) {
            setSignupError('An account with this email already exists. Please sign in instead.');
            toast.error('An account with this email already exists. Please sign in instead.');
          } else if (error.message.includes('constraint violation') || error.message.includes('Database error')) {
            setSignupError('There was a problem with your account details. Please try a different email or clinic name.');
            toast.error('There was a problem with your account details. Please try a different email or clinic name.');
          } else {
            setSignupError(error.message);
            toast.error(error.message);
          }
        } else {
          setSignupError('An error occurred during sign up. Please try again.');
          toast.error('An error occurred during sign up. Please try again.');
        }
      } else {
        console.log('Sign up successful, navigating to verification page');
        localStorage.setItem('verificationEmail', formData.email);
        toast.success('Sign up successful! Please verify your email to continue.');
        navigate('/verify-email');
      }
    } catch (error: any) {
      console.error('Unexpected sign up error:', error);
      console.error('Error stack:', error.stack);
      setSignupError(error.message || 'An unexpected error occurred');
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create an account" 
      subtitle="Start accepting payments for your clinic"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {signupError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="text-red-500 mr-2 h-5 w-5 mt-0.5" />
            <span className="text-red-700 text-sm">{signupError}</span>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="clinicName">Clinic Name</Label>
          <Input
            id="clinicName"
            name="clinicName"
            type="text"
            placeholder="Your Clinic Name"
            value={formData.clinicName}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full input-focus"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="clinic@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full input-focus"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirmPassword">Confirm Password</Label>
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
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="agreeTerms" 
            checked={formData.agreeTerms}
            onCheckedChange={handleCheckboxChange}
            disabled={isLoading}
          />
          <Label 
            htmlFor="agreeTerms" 
            className="text-sm font-normal"
          >
            I agree to the{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-800">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-800">
              Privacy Policy
            </Link>
          </Label>
        </div>
        
        <Button 
          type="submit" 
          className="w-full btn-gradient"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Create Account
        </Button>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignUpPage;
