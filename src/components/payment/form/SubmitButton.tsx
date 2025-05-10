
import React, { useRef, useEffect } from 'react';
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
  // Ref to track button clicks and prevent double-submissions
  const clickedRef = useRef(false);
  
  // Reset clicked state when loading state changes
  useEffect(() => {
    if (!isLoading) {
      clickedRef.current = false;
    }
  }, [isLoading]);

  const handleClick = () => {
    if (!clickedRef.current && !isLoading) {
      console.log('Payment button clicked');
      clickedRef.current = true;
    } else {
      console.log('Preventing duplicate payment button click');
    }
  };

  return (
    <Button 
      type="submit" 
      className="w-full h-12 btn-gradient text-lg"
      disabled={isLoading}
      onClick={handleClick}
      data-testid="payment-submit-button"
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
