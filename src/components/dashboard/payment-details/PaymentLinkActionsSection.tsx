
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="mt-2">
      <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Link</h4>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCopyLink}
          className="text-gray-700"
        >
          <Copy className="h-4 w-4 mr-1" />
          Copy Link
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleOpenLink}
          className="text-gray-700"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Open Link
        </Button>
      </div>
    </div>
  );
};

export default PaymentLinkActionsSection;
