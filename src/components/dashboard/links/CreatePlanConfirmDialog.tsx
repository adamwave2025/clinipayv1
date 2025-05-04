
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LinkFormData } from '@/hooks/useCreateLinkForm';
import { Check } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, amountToCents } from '@/utils/formatters';

interface CreatePlanConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: LinkFormData | null;
  onConfirm: () => void;
  isLoading: boolean;
}

const CreatePlanConfirmDialog = ({
  open,
  onOpenChange,
  formData,
  onConfirm,
  isLoading
}: CreatePlanConfirmDialogProps) => {
  if (!formData) return null;

  // Calculate total amount
  const totalAmount = formData.paymentPlan && formData.paymentCount && formData.amount
    ? parseFloat(formData.amount) * Number(formData.paymentCount)
    : 0;

  // Format frequency display text
  const getFrequencyText = (cycle: string) => {
    switch (cycle) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Every 2 Weeks';
      case 'monthly': return 'Monthly';
      default: return cycle;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            Confirm Payment Plan
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium text-lg">{formData.paymentTitle}</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Amount per payment:</span> {formatCurrency(parseFloat(formData.amount))}</p>
              <p><span className="font-medium">Number of payments:</span> {formData.paymentCount}</p>
              <p><span className="font-medium">Frequency:</span> {getFrequencyText(formData.paymentCycle)}</p>
              <p><span className="font-medium">Total value:</span> {formatCurrency(totalAmount)}</p>
              {formData.description && (
                <p className="mt-2 text-gray-600">{formData.description}</p>
              )}
            </div>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-md text-amber-700 text-sm">
            <p>This will create a payment plan that can be scheduled for patients.</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            className="btn-gradient w-full sm:w-auto" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Payment Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlanConfirmDialog;
