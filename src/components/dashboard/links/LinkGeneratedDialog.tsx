
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
import { LinkFormData } from './CreateLinkForm';

interface LinkGeneratedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedLink: string | null;
  formData: LinkFormData | null;
  onReset: () => void;
}

const LinkGeneratedDialog = ({ 
  open, 
  onOpenChange, 
  generatedLink, 
  formData,
  onReset
}: LinkGeneratedDialogProps) => {
  
  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Link copied to clipboard');
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      onReset();
    }
    onOpenChange(newOpen);
  };

  // Check if this is a payment plan
  const isPaymentPlan = formData?.paymentPlan || false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
                    {formData.paymentCount} payments of £{Number(formData.amount).toFixed(2)} ({formData.paymentCycle})
                  </p>
                  <p className="text-sm">
                    Total: £{(Number(formData.amount) * Number(formData.paymentCount)).toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-sm">
                  {formData.paymentTitle} - £{Number(formData.amount).toFixed(2)}
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
            className="btn-gradient w-full" 
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
