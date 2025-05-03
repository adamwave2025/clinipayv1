
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ActivePlansTableProps {
  isLoading: boolean;
  plans: any[];
  onCreatePlanClick: () => void;
  onViewPlanDetails: (plan: any) => void;
}

const ActivePlansTable = ({ 
  isLoading, 
  plans, 
  onCreatePlanClick, 
  onViewPlanDetails 
}: ActivePlansTableProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Active Patient Plans</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            Loading payment plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No active payment plans found. Create your first payment plan to get started.</p>
            <Button 
              className="mt-4 btn-gradient" 
              onClick={onCreatePlanClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Payment Plan
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Plan Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow 
                  key={plan.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onViewPlanDetails(plan)}
                >
                  <TableCell className="font-medium">{plan.patientName}</TableCell>
                  <TableCell>{plan.planName}</TableCell>
                  <TableCell>£{plan.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-primary rounded-full" 
                          style={{ width: `${plan.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {plan.paidInstallments}/{plan.totalInstallments}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`
                        ${plan.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                        ${plan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${plan.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
                      `}
                    >
                      {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {plan.nextDueDate ? new Date(plan.nextDueDate).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivePlansTable;
