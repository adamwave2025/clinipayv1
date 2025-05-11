
import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { Plan, formatPlanFromDb } from '@/utils/planTypes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import { isPlanPaused } from '@/utils/plan-status-utils';

interface PatientPlansProps {
  patientId: string;
  onViewPlanDetails: (plan: Plan) => void;
}

const PatientPlans: React.FC<PatientPlansProps> = ({ patientId, onViewPlanDetails }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch patient payment plans
  useEffect(() => {
    const fetchPatientPaymentPlans = async () => {
      if (!patientId) return;
      
      setIsLoading(true);
      
      try {
        // Directly query the plans table for this patient
        const { data, error } = await supabase
          .from('plans')
          .select(`
            *,
            patients (name),
            payment_links (title, payment_cycle)
          `)
          .eq('patient_id', patientId);

        if (error) throw error;
        
        if (!data || data.length === 0) {
          setPlans([]);
          setIsLoading(false);
          return;
        }

        // Format plans using the formatPlanFromDb utility
        const formattedPlans = data.map(plan => {
          const formattedPlan = formatPlanFromDb(plan);
          
          // Add additional fields needed for display
          formattedPlan.patientName = plan.patients?.name || 'Unknown Patient';
          formattedPlan.paymentFrequency = plan.payment_links?.payment_cycle || formattedPlan.paymentFrequency;
          
          return formattedPlan;
        });
        
        setPlans(formattedPlans);
      } catch (err) {
        console.error('Error fetching patient payment plans:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientPaymentPlans();
  }, [patientId]);

  if (plans.length === 0 && !isLoading) {
    return null; // No plans to display
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-3">Payment Plans</h3>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow 
                  key={plan.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => onViewPlanDetails(plan)}
                >
                  <TableCell className="font-medium">{plan.title || plan.planName}</TableCell>
                  <TableCell>{formatCurrency(plan.totalAmount || 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
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
                    <StatusBadge 
                      status={plan.status as any} 
                      manualPayment={plan.manualPayment}
                    />
                  </TableCell>
                  <TableCell>
                    {plan.nextDueDate ? formatDate(plan.nextDueDate) : 
                      (isPlanPaused(plan) ? 'Plan paused' : 'No upcoming payments')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PatientPlans;
