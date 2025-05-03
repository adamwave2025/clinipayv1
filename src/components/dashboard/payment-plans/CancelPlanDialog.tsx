
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface CancelPlanDialogProps {
  showDialog: boolean;
  setShowDialog: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  planName: string;
  patientName: string;
}

const CancelPlanDialog = ({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName
}: CancelPlanDialogProps) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Payment Plan</DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to cancel this payment plan? All pending payments will be cancelled.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 p-4 border rounded-md bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-700">Warning</h3>
              <p className="text-sm text-gray-700 mt-1">This will cancel all pending payments for:</p>
              <p className="text-sm text-gray-700"><strong>Patient:</strong> {patientName}</p>
              <p className="text-sm text-gray-700"><strong>Plan:</strong> {planName}</p>
              <p className="text-sm text-gray-700 mt-2">This action cannot be undone. Any payments already processed will not be affected.</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isProcessing}>Cancel</Button>
          </DialogClose>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Cancelling...' : 'Cancel Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelPlanDialog;
