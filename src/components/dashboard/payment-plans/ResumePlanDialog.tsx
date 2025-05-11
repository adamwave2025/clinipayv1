
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ResumePlanDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirm: (resumeDate: Date) => void;
  planName: string;
  patientName: string;
  isProcessing?: boolean;
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
  resumeError = null,
}: ResumePlanDialogProps) => {
  // Default resume date set to tomorrow to avoid issues with today's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [resumeDate, setResumeDate] = useState<Date>(tomorrow);
  const [dateSelected, setDateSelected] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateDate = (date: Date) => {
    const errors = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      errors.push('Resume date cannot be in the past');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleConfirm = () => {
    if (!dateSelected) {
      setDateSelected(true);
      return;
    }
    
    if (validateDate(resumeDate)) {
      onConfirm(resumeDate);
    }
  };

  // Disable dates in the past
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  // Clear validation errors when dialog is opened or closed
  React.useEffect(() => {
    if (showDialog) {
      setValidationErrors([]);
      setDateSelected(false);
      // Reset to tomorrow's date when dialog opens
      const newTomorrow = new Date();
      newTomorrow.setDate(newTomorrow.getDate() + 1);
      setResumeDate(newTomorrow);
    }
  }, [showDialog]);

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resume Payment Plan</AlertDialogTitle>
          <AlertDialogDescription>
            Select a date to resume the <span className="font-semibold">{planName}</span> payment plan for{' '}
            <span className="font-semibold">{patientName}</span>.
          </AlertDialogDescription>
          
          {resumeError && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-xs text-red-700">
                {resumeError}
              </AlertDescription>
            </Alert>
          )}
          
          {validationErrors.length > 0 && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-xs text-red-700">
                {validationErrors.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Date picker */}
          <div className="mt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Select a resume date:</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateSelected && "border-red-300"
                    )}
                  >
                    {resumeDate ? format(resumeDate, "PPP") : <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={resumeDate}
                    onSelect={(date) => {
                      if (date) {
                        setResumeDate(date);
                        setDateSelected(true);
                        validateDate(date);
                      }
                    }}
                    disabled={disablePastDates}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {!dateSelected && (
                <p className="text-xs text-red-500">Please select a resume date</p>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
            disabled={isProcessing || (dateSelected && validationErrors.length > 0)}
          >
            {isProcessing ? (
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
