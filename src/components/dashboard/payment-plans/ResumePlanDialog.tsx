
import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ResumePlanDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirm: (resumeDate?: Date) => void;
  planName: string;
  patientName: string;
  isProcessing?: boolean;
  isLoading?: boolean;
  hasSentPayments?: boolean;
  hasOverduePayments?: boolean;
  hasPaidPayments?: boolean;
  resumeError?: string | null;
}

const ResumePlanDialog = ({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName,
  isProcessing = false,
  isLoading = false,
  hasSentPayments = false,
  hasOverduePayments = false,
  hasPaidPayments = false,
  resumeError = null,
}: ResumePlanDialogProps) => {
  // Use either isLoading or isProcessing (prioritize isProcessing)
  const isWorking = isProcessing || isLoading;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [resumeDate, setResumeDate] = useState<Date>(new Date());

  const handleConfirm = () => {
    onConfirm(showDatePicker ? resumeDate : undefined);
  };

  console.log('ResumePlanDialog props:', {
    showDialog,
    planName,
    patientName,
    isWorking,
    hasSentPayments,
    hasOverduePayments,
    hasPaidPayments,
    resumeError
  });

  // Disable dates in the past
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resume Payment Plan</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to resume the <span className="font-semibold">{planName}</span> payment plan for{' '}
            <span className="font-semibold">{patientName}</span>?
          </AlertDialogDescription>
          <p className="text-sm text-muted-foreground mt-2">
            This will activate all upcoming payments according to the original schedule.
          </p>
          
          {resumeError && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-xs text-red-700">
                {resumeError}
              </AlertDescription>
            </Alert>
          )}
          
          {hasSentPayments && (
            <Alert className="mt-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs text-amber-700">
                This plan has payment requests that have already been sent to the patient.
                Resuming will reactivate those requests.
              </AlertDescription>
            </Alert>
          )}
          
          {hasOverduePayments && (
            <Alert className="mt-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs text-amber-700">
                This plan has overdue payments. Resuming will keep them marked as overdue.
              </AlertDescription>
            </Alert>
          )}
          
          {hasPaidPayments && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> This plan has payment(s) that have already been made. 
                Those payments will remain recorded.
              </p>
            </div>
          )}
          
          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={showDatePicker} 
                onChange={() => setShowDatePicker(!showDatePicker)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-sm">Schedule a future resume date</span>
            </label>
            
            {showDatePicker && (
              <div className="mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !resumeDate && "text-muted-foreground"
                      )}
                    >
                      {resumeDate ? format(resumeDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={resumeDate}
                      onSelect={(date) => date && setResumeDate(date)}
                      disabled={disablePastDates}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
            disabled={isWorking}
          >
            {isWorking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Resume Plan'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResumePlanDialog;
