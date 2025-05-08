
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, AlertCircle, Info } from "lucide-react";
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
  hasOverduePayments?: boolean; // New prop to indicate if plan had overdue payments when paused
}

const ResumePlanDialog = ({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName,
  isProcessing = false,
  hasSentPayments = false,
  hasOverduePayments = false, // Default to false if not provided
}: ResumePlanDialogProps) => {
  // Initialize with current date but set hours to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [date, setDate] = useState<Date>(today);

  const handleConfirm = () => {
    // Ensure the date is normalized to midnight to avoid timezone issues
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    console.log('Confirming with date:', normalizedDate.toISOString());
    onConfirm(normalizedDate);
  };

  // Disable dates in the past
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

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
              This plan had overdue payments before it was paused. Upon resuming, 
              payments that are still overdue will be marked as such.
            </AlertDescription>
          </Alert>
        )}
        
        <Alert variant="default" className="bg-blue-50 border-blue-300 text-blue-800">
          <Info className="h-4 w-4" />
          <AlertDescription>
            If no payments have been made on this plan, it will resume with "pending" status.
            Once the first payment is received, it will change to "active".
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
                  disabled={isProcessing}
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
          <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
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
