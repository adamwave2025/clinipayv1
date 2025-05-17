
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanActionsDropdownProps {
  onCancelPlan: () => void;
  onPausePlan?: () => void;
  onResumePlan?: () => void;
  onReschedulePlan: () => void;
  isPaused: boolean;
  isDisabled: boolean;
  isLoading?: boolean;
}

const PlanActionsDropdown = ({
  onCancelPlan,
  onPausePlan,
  onResumePlan,
  onReschedulePlan,
  isPaused,
  isDisabled,
  isLoading = false,
}: PlanActionsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onPausePlan && !isPaused && (
          <DropdownMenuItem onClick={onPausePlan} disabled={isDisabled || isLoading}>
            Pause Plan
          </DropdownMenuItem>
        )}
        {onResumePlan && isPaused && (
          <DropdownMenuItem onClick={onResumePlan} disabled={isDisabled || isLoading}>
            Resume Plan
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onClick={onReschedulePlan} 
          disabled={isDisabled || isLoading || isPaused}
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            "Reschedule Plan"
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onCancelPlan} 
          disabled={isDisabled || isLoading}
          className="text-red-500 focus:text-red-500 focus:bg-red-50"
        >
          Cancel Plan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PlanActionsDropdown;
