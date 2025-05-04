import React, { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/hooks/usePatients';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import PaymentLinkActionsSection from '@/components/dashboard/payment-details/PaymentLinkActionsSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment, formatPlanInstallments, groupPaymentSchedulesByPlan } from '@/utils/paymentPlanUtils';
import { PlanActivity, formatPlanActivities } from '@/utils/planActivityUtils';
import { fetchPaymentSchedules } from '@/services/PaymentScheduleService';
import PatientNotes from './PatientNotes';
import PatientActivity from './PatientActivity';
import { usePlanQuickAccess } from '@/hooks/usePlanQuickAccess';
import PlanDetailsDialog from '@/components/dashboard/payment-plans/PlanDetailsDialog';
import CancelPlanDialog from '@/components/dashboard/payment-plans/CancelPlanDialog';
import PausePlanDialog from '@/components/dashboard/payment-plans/PausePlanDialog';
import ResumePlanDialog from '@/components/dashboard/payment-plans/ResumePlanDialog';
import ReschedulePlanDialog from '@/components/dashboard/payment-plans/ReschedulePlanDialog';

interface PatientPayment {
  id: string;
  date: string;
  reference: string | null;
  type: string;
  title?: string;
  amount: number | null;
  status: 'paid' | 'refunded' | 'partially_refunded' | 'sent';
  paymentUrl?: string;
}

interface PatientDetailsDialogProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
}

const PatientDetailsDialog = ({ patient, open, onClose }: PatientDetailsDialogProps) => {
  const [patientPayments, setPatientPayments] = useState<PatientPayment[]>([]);
  const [planActivities, setPlanActivities] = useState<PlanActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('notes');
  
  // Payment Plans section
  const [patientPlans, setPatientPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  // Use the new hook for plan access
  const {
    selectedPlan,
    planInstallments,
    planActivities: planDetailActivities,
    isLoadingInstallments,
    isLoadingActivities,
    showPlanDetails,
    setShowPlanDetails,
    showCancelDialog,
    setShowCancelDialog,
    showPauseDialog,
    setShowPauseDialog,
    showResumeDialog,
    setShowResumeDialog,
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleViewPlanDetails,
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
    handleOpenRescheduleDialog,
    handleCancelPlan,
    handlePausePlan,
    handleResumePlan,
    handleReschedulePlan,
    isPlanPaused,
    isProcessing
  } = usePlanQuickAccess();

  useEffect(() => {
    const fetchPatientHistory = async () => {
      if (!patient.id || !open) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch completed payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            id,
            paid_at,
            amount_paid,
            status,
            payment_ref,
            payment_links(type, title)
          `)
          .eq('patient_id', patient.id)
          .order('paid_at', { ascending: false });
        
        if (paymentsError) throw paymentsError;
        
        // Fetch payment requests (sent links)
        const { data: requestsData, error: requestsError } = await supabase
          .from('payment_requests')
          .select(`
            id,
            sent_at,
            custom_amount,
            status,
            payment_links(type, title)
          `)
          .eq('patient_id', patient.id)
          .is('paid_at', null) // Only get unpaid requests
          .order('sent_at', { ascending: false });
        
        if (requestsError) throw requestsError;
        
        // Format completed payments - ensure full timestamp is preserved
        const formattedPayments = paymentsData.map((payment: any) => ({
          id: payment.id,
          date: payment.paid_at, // Full ISO timestamp
          reference: payment.payment_ref,
          type: payment.payment_links?.type || 'other',
          title: payment.payment_links?.title,
          amount: payment.amount_paid || 0, // Default to 0 if null
          status: payment.status
        }));
        
        // Format payment requests - filter out £0 amounts and ensure full timestamp
        const formattedRequests = requestsData
          .map((request: any) => {
            const amount = request.custom_amount || (request.payment_links ? request.payment_links.amount : 0);
            return {
              id: request.id,
              date: request.sent_at, // Full ISO timestamp
              reference: null,
              type: request.payment_links?.type || 'custom',
              title: request.payment_links?.title || 'Custom Payment',
              amount: amount, 
              status: 'sent' as const,
              paymentUrl: `https://clinipay.co.uk/payment/${request.id}`
            };
          })
          .filter(request => request.amount > 0); // Filter out zero amounts
        
        // Combine and sort by date (newest first) - verify sorting is working correctly
        const combinedHistory = [...formattedPayments, ...formattedRequests].sort((a, b) => {
          // Ensure we're using proper date objects for comparison
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // Newest first
        });
        
        console.log('Sorted patient payment history:', combinedHistory);
        
        setPatientPayments(combinedHistory);
      } catch (err: any) {
        console.error('Error fetching patient history:', err);
        setError('Failed to load payment history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientHistory();
  }, [patient.id, open, showPlanDetails]); // Refetch when plan details dialog closes

  // Fetch plan activities
  useEffect(() => {
    const fetchPlanActivities = async () => {
      if (!patient.id || !open) return;
      
      setLoadingActivities(true);
      
      try {
        const { data, error } = await supabase
          .from('payment_plan_activities')
          .select('*')
          .eq('patient_id', patient.id)
          .order('performed_at', { ascending: false });
          
        if (error) throw error;
        
        setPlanActivities(formatPlanActivities(data || []));
      } catch (err: any) {
        console.error('Error fetching plan activities:', err);
      } finally {
        setLoadingActivities(false);
      }
    };
    
    fetchPlanActivities();
  }, [patient.id, open, showPlanDetails]); // Refetch when plan details dialog closes

  // Updated useEffect for fetching patient payment plans
  useEffect(() => {
    const fetchPatientPaymentPlans = async () => {
      if (!patient.id || !open) return;
      
      setLoadingPlans(true);
      
      try {
        // Get clinic_id directly from the patient record
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('clinic_id')
          .eq('id', patient.id)
          .single();

        if (patientError) throw patientError;
        
        if (!patientData?.clinic_id) {
          console.error('No clinic_id found for patient:', patient.id);
          setLoadingPlans(false);
          return;
        }

        const clinicId = patientData.clinic_id;
        
        // Fetch all payment schedules for the clinic
        const scheduleData = await fetchPaymentSchedules(clinicId);
        
        // Filter only this patient's plans
        const filteredScheduleData = scheduleData.filter(item => 
          item.patient_id === patient.id
        );
        
        // Format into plan objects
        const plansMap = groupPaymentSchedulesByPlan(filteredScheduleData);
        const plansArray = Array.from(plansMap.values());
        
        setPatientPlans(plansArray);
      } catch (err) {
        console.error('Error fetching patient payment plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    
    fetchPatientPaymentPlans();
  }, [patient.id, open, showPlanDetails]); // Refetch when plan details dialog closes
  
  // Function to get the clinic ID from the patient for notes
  const getClinicId = () => {
    return patient.clinic_id || '';
  };
  
  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-y-auto p-0">
          <div className="p-6">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-2xl">{patient.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">Patient information and payment details</p>
            </SheetHeader>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                
                {patient.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>{patient.email}</span>
                  </div>
                )}
                
                {patient.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{patient.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment Summary</h3>
                
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                  <span>Total Spent: <strong>{formatCurrency(patient.totalSpent || 0)}</strong></span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>Last Payment: <strong>{patient.lastPaymentDate ? formatDate(patient.lastPaymentDate) : 'N/A'}</strong></span>
                </div>
              </div>
            </div>
            
            {/* Payment Plans moved outside tabs */}
            {patientPlans.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Payment Plans</h3>
                {loadingPlans ? (
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
                        {patientPlans.map((plan) => (
                          <TableRow 
                            key={plan.id}
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleViewPlanDetails(plan)}
                          >
                            <TableCell className="font-medium">{plan.title || plan.planName}</TableCell>
                            <TableCell>{formatCurrency(plan.totalAmount || plan.amount || 0)}</TableCell>
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
                              <StatusBadge status={plan.status as any} />
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
            )}
            
            <Separator className="my-6" />

            {/* Updated tabs to Notes / Activity */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 p-1">
                <TabsTrigger 
                  value="notes"
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
                >
                  Notes
                </TabsTrigger>
                <TabsTrigger 
                  value="activity"
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
                >
                  Activity
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="notes">
                <PatientNotes 
                  patientId={patient.id}
                  clinicId={getClinicId()}
                />
              </TabsContent>
              
              <TabsContent value="activity">
                <PatientActivity 
                  payments={patientPayments} 
                  planActivities={planActivities} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Plan Details Dialog */}
      <PlanDetailsDialog
        showPlanDetails={showPlanDetails}
        setShowPlanDetails={setShowPlanDetails}
        selectedPlan={selectedPlan}
        installments={planInstallments}
        activities={planDetailActivities}
        isLoadingActivities={isLoadingActivities}
        onSendReminder={() => {}} // No-op as we don't need this functionality here
        onViewPaymentDetails={() => {}} // No-op as we don't need this functionality here
        onCancelPlan={handleOpenCancelDialog}
        onPausePlan={handleOpenPauseDialog}
        onResumePlan={handleOpenResumeDialog}
        onReschedulePlan={handleOpenRescheduleDialog}
        isPlanPaused={isPlanPaused}
      />

      {/* Plan Action Dialogs */}
      <CancelPlanDialog
        showDialog={showCancelDialog}
        setShowDialog={setShowCancelDialog}
        onConfirm={handleCancelPlan}
        planName={selectedPlan?.title || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />

      <PausePlanDialog
        showDialog={showPauseDialog}
        setShowDialog={setShowPauseDialog}
        onConfirm={handlePausePlan}
        planName={selectedPlan?.title || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />

      <ResumePlanDialog
        showDialog={showResumeDialog}
        setShowDialog={setShowResumeDialog}
        onConfirm={handleResumePlan}
        planName={selectedPlan?.title || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />

      <ReschedulePlanDialog
        showDialog={showRescheduleDialog}
        setShowDialog={setShowRescheduleDialog}
        onConfirm={handleReschedulePlan}
        planName={selectedPlan?.title || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />
    </>
  );
};

export default PatientDetailsDialog;
