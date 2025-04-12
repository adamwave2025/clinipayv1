
import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentReferenceDisplayProps {
  reference: string;
  className?: string;
  onCopy?: () => void;
}

const PaymentReferenceDisplay = ({ reference, className = '', onCopy }: PaymentReferenceDisplayProps) => {
  if (!reference) return null;
  
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-sm font-medium text-gray-500">Reference</p>
      <div className="flex items-center">
        <p className="font-mono text-sm bg-gray-50 py-2 px-3 rounded border border-gray-200 break-all flex-1">
          {reference}
        </p>
        {onCopy && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCopy}
            className="ml-2 h-8 w-8"
            title="Copy reference"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentReferenceDisplay;
