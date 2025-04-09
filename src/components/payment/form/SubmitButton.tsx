
import React from 'react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface SubmitButtonProps {
  isLoading: boolean;
}

const SubmitButton = ({ isLoading }: SubmitButtonProps) => {
  return (
    <Button 
      type="submit" 
      className="w-full h-12 btn-gradient text-lg"
      disabled={isLoading}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" className="mr-2" />
      ) : null}
      Pay Now
    </Button>
  );
};

export default SubmitButton;
