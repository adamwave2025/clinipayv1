
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    selectedLink?: string;
    customAmount?: string;
    message?: string;
  };
  paymentAmount: string;
  selectedPaymentLink: {
    title: string;
  } | null;
  isLoading: boolean;
  onConfirm: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  formData,
  paymentAmount,
  selectedPaymentLink,
  isLoading,
  onConfirm
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            Confirm Payment Link Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Recipient:</p>
            <p className="text-sm">{formData.patientName}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">Send to:</p>
            <p className="text-sm">
              Email: {formData.patientEmail}
              {formData.patientPhone && <span> | Phone: {formData.patientPhone}</span>}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">Payment Details:</p>
            <p className="text-sm">
              {selectedPaymentLink ? (
                <>Payment for: {selectedPaymentLink.title} ({paymentAmount})</>
              ) : (
                <>Custom payment amount: {paymentAmount}</>
              )}
            </p>
          </div>
          
          {formData.message && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Custom Message:</p>
              <p className="text-sm">{formData.message}</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="btn-gradient"
          >
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Send Payment Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
