
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReschedulePlanDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirm: (newStartDate: Date) => void;
  planName: string;
  patientName: string;
  isLoading?: boolean;
  isProcessing?: boolean;
  hasSentPayments?: boolean;
  hasOverduePayments?: boolean;
  startDate?: string;
}

const ReschedulePlanDialog = ({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName,
  isLoading = false,
  isProcessing = false,
  startDate,
}: ReschedulePlanDialogProps) => {
  // Initialize with current date or parse the startDate if provided
  const initialDate = startDate ? new Date(startDate) : new Date();
  initialDate.setHours(0, 0, 0, 0); // Normalize to midnight
  
  const [date, setDate] = useState<Date>(initialDate);
  
  // Use either isLoading or isProcessing (prioritize isProcessing)
  const isWorking = isProcessing || isLoading;

  const handleConfirm = () => {
    // Ensure the date is normalized to midnight to avoid timezone issues
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    console.log('Confirming with date:', normalizedDate.toISOString());
    onConfirm(normalizedDate);
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Payment Plan</DialogTitle>
          <DialogDescription>
            Select a new start date to reschedule the <span className="font-semibold">{planName}</span> payment plan for{' '}
            <span className="font-semibold">{patientName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2">
            <label htmlFor="rescheduleDate" className="text-sm font-medium">
              New Start Date
            </label>
            <input
              type="date"
              id="rescheduleDate"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              value={date.toISOString().split('T')[0]}
              min={today}
              onChange={(e) => {
                if (e.target.value) {
                  // Ensure the time is set to midnight
                  const newDate = new Date(e.target.value);
                  newDate.setHours(0, 0, 0, 0);
                  console.log('Selected date:', newDate.toISOString());
                  setDate(newDate);
                }
              }}
              disabled={isWorking}
            />
            <p className="text-xs text-muted-foreground mt-1">
              All future payments will be rescheduled based on this date.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isWorking}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="btn-gradient"
            disabled={isWorking}
          >
            {isWorking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Reschedule Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReschedulePlanDialog;
