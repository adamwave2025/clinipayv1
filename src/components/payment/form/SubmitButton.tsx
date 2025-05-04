
import React from 'react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface SubmitButtonProps {
  isLoading: boolean;
  loadingText?: string;
  defaultText?: string;
}

const SubmitButton = ({ 
  isLoading, 
  loadingText = "Processing...", 
  defaultText = "Pay Now" 
}: SubmitButtonProps) => {
  return (
    <Button 
      type="submit" 
      className="w-full h-12 btn-gradient text-lg"
      disabled={isLoading}
    >
      <span className="flex items-center justify-center">
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            <span>{loadingText}</span>
          </>
        ) : (
          defaultText
        )}
      </span>
    </Button>
  );
};

export default SubmitButton;
