
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PaymentLinkActionsSectionProps {
  status: string;
  paymentUrl: string | undefined;
}

const PaymentLinkActionsSection = ({ status, paymentUrl }: PaymentLinkActionsSectionProps) => {
  if (status !== 'sent' || !paymentUrl) return null;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    toast.success('Payment link copied to clipboard');
  };
  
  const handleOpenLink = () => {
    window.open(paymentUrl, '_blank');
  };
  
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopyLink}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy Link</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy link</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenLink}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open Link</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open link</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default PaymentLinkActionsSection;
