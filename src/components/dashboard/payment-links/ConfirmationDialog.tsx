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
import { format } from 'date-fns';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';

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
    startDate?: Date;
  };
  paymentAmount: string;
  selectedPaymentLink: {
    title: string;
    paymentCount?: number;
    paymentCycle?: string;
    amount?: number;
  } | null;
  isPaymentPlan: boolean;
  isLoading: boolean;
  isSchedulingPlan?: boolean;
  onConfirm: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  formData,
  paymentAmount,
  selectedPaymentLink,
  isPaymentPlan,
  isLoading,
  isSchedulingPlan = false,
  onConfirm
}) => {
  // Determine the current loading state based on payment type
  const isCurrentlyLoading = isPaymentPlan ? isSchedulingPlan : isLoading;
  
  const formatCycle = (cycle?: string) => {
    if (!cycle) return 'monthly';
    switch (cycle) {
      case 'weekly': return 'Weekly';
      case 'bi-weekly': return 'Bi-Weekly';
      case 'monthly': return 'Monthly';
      default: return cycle.charAt(0).toUpperCase() + cycle.slice(1);
    }
  };

  const getPlanDetails = () => {
    if (!selectedPaymentLink?.paymentCount || selectedPaymentLink.amount === undefined) return null;
    
    // Each payment is the full amount, not divided
    return `${selectedPaymentLink.paymentCount} × ${formatCurrency(selectedPaymentLink.amount)} ${formatCycle(selectedPaymentLink.paymentCycle)} payments`;
  };

  const getPlanTotal = () => {
    if (!selectedPaymentLink?.paymentCount || selectedPaymentLink.amount === undefined) return null;
    
    // Calculate total plan value
    const totalAmount = selectedPaymentLink.amount * selectedPaymentLink.paymentCount;
    return formatCurrency(totalAmount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            {isPaymentPlan ? 'Confirm Payment Plan Details' : 'Confirm Payment Link Details'}
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
            {isPaymentPlan && getPlanDetails() && (
              <p className="text-sm text-gray-600">{getPlanDetails()}</p>
            )}
            {isPaymentPlan && getPlanTotal() && (
              <p className="text-sm font-medium text-gray-800">Total plan value: {getPlanTotal()}</p>
            )}
          </div>
          
          {isPaymentPlan && formData.startDate && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Start Date:</p>
              <p className="text-sm">{format(formData.startDate, 'PPP')}</p>
            </div>
          )}
          
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
            disabled={isCurrentlyLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isCurrentlyLoading}
            className="btn-gradient"
          >
            {isCurrentlyLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {isPaymentPlan ? 'Scheduling...' : 'Sending...'}
              </>
            ) : (
              isPaymentPlan ? 'Schedule Payment Plan' : 'Send Payment Link'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
