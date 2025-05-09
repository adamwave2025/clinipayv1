
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  isLoading: boolean;
  label?: string;
}

const SubmitButton = ({ 
  isLoading, 
  label = "Complete Payment" 
}: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      className="w-full mt-6 py-6 text-base"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        <>{label}</>
      )}
    </Button>
  );
};

export default SubmitButton;
