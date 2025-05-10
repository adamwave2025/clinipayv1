
import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import { Progress } from '@/components/ui/progress';

interface PaymentPlanBreakdownProps {
  planTotalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  isOverdue?: boolean;
  paymentLinkId?: string;
}

const PaymentPlanBreakdown: React.FC<PaymentPlanBreakdownProps> = ({
  planTotalAmount,
  totalPaid,
  totalOutstanding,
  isOverdue = false,
  paymentLinkId
}) => {
  // Calculate payment progress percentage with safety checks
  const progressPercentage = planTotalAmount > 0 
    ? Math.min(Math.round((totalPaid / planTotalAmount) * 100), 100)
    : 0;
    
  return (
    <div className="space-y-4">
      <div>
        {/* Payment Plan Summary */}
        <div className="space-y-1 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total plan amount:</span>
            <span className="font-medium">{formatCurrency(planTotalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Already paid:</span>
            <span className="font-medium">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className={isOverdue ? "text-red-600" : "text-gray-700"}>
              {isOverdue ? "Overdue balance:" : "Remaining balance:"}
            </span>
            <span className={isOverdue ? "text-red-600" : "text-gray-700"}>
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={`h-2 ${isOverdue ? "bg-red-100" : "bg-gray-100"}`}
            indicatorClassName={isOverdue ? "bg-red-500" : "bg-[#9b87f5]"} 
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentPlanBreakdown;
