import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';
import { formatCurrency } from '@/utils/formatters'; // Import the formatCurrency utility

interface PaymentLinkDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentLink: PaymentLink | null;
}

const PaymentLinkDetailsDialog = ({ 
  open, 
  onOpenChange, 
  paymentLink 
}: PaymentLinkDetailsDialogProps) => {
  if (!paymentLink) return null;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink.url);
    toast.success('Link copied to clipboard');
  };

  const handleOpenLink = () => {
    window.open(paymentLink.url, '_blank');
  };

  /**
   * IMPORTANT: MONETARY VALUE HANDLING
   * 
   * The `amount` field in payment links is stored in pennies/cents (e.g., 1000 for £10.00)
   * We use the formatCurrency utility which automatically:
   * - Converts from pennies/cents to pounds/dollars by dividing by 100
   * - Formats the value with the proper currency symbol and decimal places
   */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Link Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-semibold">{paymentLink.title}</h3>
            <p className="text-lg font-bold">{formatCurrency(paymentLink.amount)}</p>
            <p className="text-sm text-gray-500">Type: {paymentLink.type}</p>
            <p className="text-sm text-gray-500">Created: {paymentLink.createdAt}</p>
            
            {paymentLink.description && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{paymentLink.description}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Link:</p>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg break-all">
              <p className="text-sm text-gray-600 flex-1">{paymentLink.url}</p>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCopyLink}
                className="flex-shrink-0 ml-2"
                aria-label="Copy link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            className="w-full sm:w-auto" 
            variant="outline"
            onClick={handleCopyLink}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          <Button 
            className="w-full sm:w-auto btn-gradient" 
            onClick={handleOpenLink}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkDetailsDialog;
