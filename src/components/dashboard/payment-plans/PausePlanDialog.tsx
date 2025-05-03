
import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PausePlanDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirm: () => void;
  planName: string;
  patientName: string;
  isProcessing?: boolean;
}

const PausePlanDialog = ({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName,
  isProcessing = false,
}: PausePlanDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pause Payment Plan</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to pause the <span className="font-semibold">{planName}</span> payment plan for{' '}
            <span className="font-semibold">{patientName}</span>?
          </AlertDialogDescription>
          <p className="text-sm text-muted-foreground mt-2">
            This will pause all upcoming payments. You can resume the plan later.
          </p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-amber-600 hover:bg-amber-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pause Plan'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PausePlanDialog;
