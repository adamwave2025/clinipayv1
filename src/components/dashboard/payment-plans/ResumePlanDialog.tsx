
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, AlertCircle, Info, XCircle } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

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
  hasSentPayments = false,
  hasOverduePayments = false,
  hasPaidPayments = false,
  resumeError = null,
}: ResumePlanDialogProps) => {
  // Initialize with current date but set hours to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [date, setDate] = useState<Date>(today);
  const [dateSelectionConfirmed, setDateSelectionConfirmed] = useState(false);

  const handleConfirm = () => {
    // Ensure the date is normalized to midnight to avoid timezone issues
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    console.log('Confirming resume with normalized date:', normalizedDate.toISOString());
    setDateSelectionConfirmed(true);
    onConfirm(normalizedDate);
  };

  // Disable dates in the past
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (showDialog) {
      // Set today's date when dialog opens
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setDate(today);
    } else {
      setDateSelectionConfirmed(false);
    }
  }, [showDialog]);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Resume Payment Plan</DialogTitle>
          <DialogDescription>
            Select a date to resume the <span className="font-semibold">{planName}</span> payment plan for{' '}
            <span className="font-semibold">{patientName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        {resumeError && (
          <Alert variant="destructive" className="bg-red-50 border-red-400 text-red-800">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Error: {resumeError}
            </AlertDescription>
          </Alert>
        )}
        
        {hasSentPayments && (
          <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This plan contains payments that were already sent to the patient but not yet paid.
              These will be reset when you resume the plan and will need to be sent again.
            </AlertDescription>
          </Alert>
        )}

        {hasOverduePayments && (
          <Alert variant="default" className="bg-red-50 border-red-300 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This plan has payments with due dates in the past. Upon resuming, 
              these payments will be marked as overdue if any payments have been made.
            </AlertDescription>
          </Alert>
        )}
        
        <Alert variant="default" className="bg-green-50 border-green-300 text-green-800">
          <Info className="h-4 w-4" />
          <AlertDescription>
            The date you select will be used to reschedule the next pending payment.
            All future payments will be adjusted accordingly.
          </AlertDescription>
        </Alert>
        
        <div className="py-4">
          <div className="space-y-2">
            <label htmlFor="resumeDate" className="text-sm font-medium">
              Resume Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isProcessing || dateSelectionConfirmed}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 max-h-[300px] overflow-y-auto" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      // Ensure the time is set to midnight
                      const normalizedDate = new Date(newDate);
                      normalizedDate.setHours(0, 0, 0, 0);
                      console.log('Selected date:', normalizedDate.toISOString());
                      setDate(normalizedDate);
                    }
                  }}
                  disabled={disablePastDates}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground mt-1">
              All future payments will be rescheduled based on this date.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowDialog(false)} 
            disabled={isProcessing || dateSelectionConfirmed}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
            disabled={isProcessing || dateSelectionConfirmed}
          >
            {isProcessing || dateSelectionConfirmed ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {dateSelectionConfirmed ? 'Resuming Plan...' : 'Processing...'}
              </>
            ) : (
              'Resume Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePlanDialog;
