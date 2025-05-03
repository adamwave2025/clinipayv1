
import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface PlanActionsDropdownProps {
  onCancelPlan: () => void;
  onPausePlan?: () => void;
  isDisabled?: boolean;
}

const PlanActionsDropdown = ({ 
  onCancelPlan, 
  onPausePlan, 
  isDisabled = false 
}: PlanActionsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center"
          disabled={isDisabled}
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Plan
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem
          onClick={onPausePlan}
          className="cursor-pointer"
          disabled={!onPausePlan}
        >
          Pause Plan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onCancelPlan}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          Cancel Plan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PlanActionsDropdown;
