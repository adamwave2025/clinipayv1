
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
      className="w-full h-14 btn-gradient text-lg font-medium shadow-md hover:shadow-lg transition-all"
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
