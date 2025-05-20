
import React, { useState, useCallback, useMemo } from 'react';
import { AlertCircle, Loader2, Calendar as CalendarIcon } from 'lucide-react';
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
import { LoadingSpinner } from '@/components/ui/spinner';

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

// Use React.memo to prevent unnecessary re-renders when props don't change
const ResumePlanDialog = React.memo(({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName,
  isProcessing = false,
  resumeError = null,
}: ResumePlanDialogProps) => {
  // Default resume date set to today
  const today = new Date();
  
  const [resumeDate, setResumeDate] = useState<Date>(today);
  const [dateSelected, setDateSelected] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  // Memoize validation function to prevent unnecessary recalculations
  const validateDate = useCallback((date: Date) => {
    const errors = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      errors.push('Resume date cannot be in the past');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, []);

  // Memoize handleConfirm for better performance
  const handleConfirm = useCallback(() => {
    if (!dateSelected) {
      setDateSelected(true);
      return;
    }
    
    if (validateDate(resumeDate)) {
      onConfirm(resumeDate);
    }
  }, [dateSelected, validateDate, resumeDate, onConfirm]);

  // Memoize disablePastDates function
  const disablePastDates = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }, []);
  
  // Clear validation errors when dialog is opened or closed
  React.useEffect(() => {
    if (showDialog) {
      setValidationErrors([]);
      // Reset to today's date when dialog opens
      const newToday = new Date();
      setResumeDate(newToday);
      // Since we're setting a valid default date, mark it as selected
      setDateSelected(true);
    }
  }, [showDialog]);

  // Handle calendar opening with a loading state
  const handleCalendarOpen = useCallback(() => {
    setIsCalendarLoading(true);
    setCalendarOpen(true);
    // Short timeout to ensure UI remains responsive during state change
    setTimeout(() => setIsCalendarLoading(false), 50);
  }, []);

  // Memoize formatted resume date to prevent unnecessary formatting
  const formattedResumeDate = useMemo(() => {
    return resumeDate ? format(resumeDate, "PPP") : "";
  }, [resumeDate]);

  // Handle date selection with optimized state updates
  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setResumeDate(date);
      setDateSelected(true);
      validateDate(date);
      // Close calendar after selection to reduce rendering burden
      setTimeout(() => setCalendarOpen(false), 100);
    }
  }, [validateDate]);

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="max-w-md">
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
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateSelected && "border-red-300"
                    )}
                    onClick={handleCalendarOpen}
                    disabled={isProcessing}
                  >
                    {isCalendarLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <CalendarIcon className="mr-2 h-4 w-4" />
                    )}
                    {formattedResumeDate || <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {isCalendarLoading ? (
                    <div className="p-4 flex justify-center">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={resumeDate}
                      onSelect={handleDateSelect}
                      disabled={disablePastDates}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  )}
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
});

// Add display name to help with debugging
ResumePlanDialog.displayName = 'ResumePlanDialog';

export default ResumePlanDialog;
