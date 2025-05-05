
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Copy, Send, Check } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LinkFormData } from '@/hooks/useCreateLinkForm';

interface LinkGeneratedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedLink: string | null;
  formData: LinkFormData | null;
}

const LinkGeneratedDialog = ({ 
  open, 
  onOpenChange, 
  generatedLink, 
  formData
}: LinkGeneratedDialogProps) => {
  
  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Link copied to clipboard');
    }
  };

  // Prevent closing the dialog when clicking outside to ensure user can copy the link
  const handleOpenChange = (newOpen: boolean) => {
    // Only allow closing through the explicit buttons
    if (newOpen === false) {
      // Optional: you can add confirmation here if needed
      // For now, we'll just let the dialog close when the user clicks a button
      onOpenChange(newOpen);
    } else {
      onOpenChange(newOpen);
    }
  };

  // Check if this is a payment plan
  const isPaymentPlan = formData?.paymentPlan || false;

  // Format displayed amount correctly (input values are already in decimal format)
  const formatAmount = (amountStr: string) => {
    const amount = parseFloat(amountStr);
    return !isNaN(amount) ? amount.toFixed(2) : '0.00';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Check className="h-6 w-6 text-green-500 mr-2" />
            {isPaymentPlan ? 'Payment Plan Created' : 'Payment Link Created'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-4 bg-green-50 rounded-lg text-green-700 text-center">
            <p className="font-medium">
              {isPaymentPlan 
                ? 'Your payment plan has been created successfully!' 
                : 'Your payment link has been generated successfully!'}
            </p>
          </div>
          
          {formData && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Payment Details:</p>
              {isPaymentPlan ? (
                <>
                  <p className="text-sm">
                    {formData.paymentTitle}
                  </p>
                  <p className="text-sm">
                    {formData.paymentCount} payments of £{formatAmount(formData.amount)} ({formData.paymentCycle})
                  </p>
                  <p className="text-sm">
                    Total: £{(parseFloat(formData.amount) * Number(formData.paymentCount)).toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-sm">
                  {formData.paymentTitle} - £{formatAmount(formData.amount)}
                </p>
              )}
              {formData.description && (
                <p className="text-sm text-gray-500 mt-1">{formData.description}</p>
              )}
            </div>
          )}
          
          {!isPaymentPlan && generatedLink && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Payment Link:</p>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg break-all">
                <p className="text-sm text-gray-600 flex-1">{generatedLink}</p>
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
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="mr-2"
          >
            Close
          </Button>
          
          <Button 
            className="btn-gradient" 
            asChild
          >
            <Link to="/dashboard/send-link" className="flex items-center justify-center">
              <Send className="mr-2 h-4 w-4" />
              Request Payment
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkGeneratedDialog;
