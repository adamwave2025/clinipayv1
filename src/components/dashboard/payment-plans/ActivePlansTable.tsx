
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';
import { debugCurrencyInfo } from '@/services/CurrencyService';
import { Plan } from '@/utils/planTypes';

interface ActivePlansTableProps {
  isLoading: boolean;
  plans: Plan[];
  totalPlanCount: number;
  onCreatePlanClick: () => void;
  onViewPlanDetails: (plan: Plan) => void;
  statusFilter: string;
}

const ActivePlansTable = ({ 
  isLoading, 
  plans, 
  totalPlanCount,
  onCreatePlanClick, 
  onViewPlanDetails,
  statusFilter
}: ActivePlansTableProps) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };
  
  // Function to generate the appropriate empty state message based on filter
  const getEmptyStateMessage = () => {
    // If there are no plans at all
    if (totalPlanCount === 0) {
      return "No active payment plans found. Schedule a patient payment plan to get started.";
    }
    
    // If there are plans, but none match the current filter
    const filterLabel = statusFilter === 'all' ? '' : statusFilter;
    return `No ${filterLabel} payment plans found.`;
  };

  // Debug log to inspect the plan data
  console.log('Plans being rendered:', plans.map(p => ({
    id: p.id,
    patientName: p.patientName, // Use the correct property
    planName: p.title || p.planName,
    progress: p.progress,
    paidInstallments: p.paidInstallments,
    totalInstallments: p.totalInstallments,
    status: p.status // Log the status to debug
  })));
  
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
            <p>{getEmptyStateMessage()}</p>
            {totalPlanCount === 0 && ( // Only show button if there are NO plans at all
              <Button 
                className="mt-4 btn-gradient" 
                onClick={() => navigate('/dashboard/send-link')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Request Payment
              </Button>
            )}
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
              {plans.map((plan) => {
                // Debug currency info to help trace monetary values
                debugCurrencyInfo(plan.amount || plan.totalAmount, `Plan ${plan.id} amount`, true);
                
                // Use patientName directly from the plan
                const patientName = plan.patientName || 'Unknown Patient';
                
                // Extract plan name/title - handle both data formats
                const planTitle = plan.title || plan.planName || 'Payment Plan';
                
                // Handle the progress/installments count display
                const paidInstallments = plan.paidInstallments || 0;
                const totalInstallments = plan.totalInstallments || 0;
                const progress = plan.progress || 0;
                
                return (
                  <TableRow 
                    key={plan.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onViewPlanDetails(plan)}
                  >
                    <TableCell className="font-medium">{patientName}</TableCell>
                    <TableCell>{planTitle}</TableCell>
                    <TableCell>{formatCurrency(plan.amount || plan.totalAmount || 0)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-primary rounded-full" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {paidInstallments}/{totalInstallments}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={plan.status} 
                        manualPayment={plan.manualPayment} 
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(plan.nextDueDate)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivePlansTable;
