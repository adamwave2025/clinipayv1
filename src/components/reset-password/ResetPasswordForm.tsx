
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { resetPassword } from '@/utils/password-reset';
import { useNavigate } from 'react-router-dom';

interface ResetPasswordFormProps {
  userId: string;
  token: string;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ userId, token }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await resetPassword(formData.password, userId, token);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update password');
      }
      
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

  return (
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
  );
};

export default ResetPasswordForm;
