
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PausePlanDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirm: () => void;
  planName: string;
  patientName: string;
  isProcessing?: boolean;
  isLoading?: boolean;
  hasSentPayments?: boolean;
}

const PausePlanDialog = ({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName,
  isProcessing = false,
  isLoading = false,
  hasSentPayments = false,
}: PausePlanDialogProps) => {
  // Use either isLoading or isProcessing (prioritize isProcessing)
  const isWorking = isProcessing || isLoading;

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
          
          {hasSentPayments && (
            <Alert className="mt-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs text-amber-700">
                This plan has payment requests that have been sent to the patient.
                Pausing will cancel those requests.
              </AlertDescription>
            </Alert>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-amber-600 hover:bg-amber-700"
            disabled={isWorking}
          >
            {isWorking ? (
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
