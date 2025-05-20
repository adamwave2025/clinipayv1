
import React, { useEffect, useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/hooks/usePatients';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, CreditCard, Pencil } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanActivity, formatPlanActivities } from '@/utils/planActivityUtils';
import PatientNotes from './PatientNotes';
import PatientActivity from './PatientActivity';
import PatientPlans from './PatientPlans';
import { usePlanQuickAccess } from '@/hooks/usePlanQuickAccess';
import PlanDetailsDialog from '@/components/dashboard/payment-plans/PlanDetailsDialog';
import PlanActionDialogs from '@/components/dashboard/payment-plans/PlanActionDialogs';
import EditPatientDialog from './EditPatientDialog';

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
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient>(patient);
  
  // Use the plan quick access hook which now uses the shared implementation
  const planQuickAccess = usePlanQuickAccess();
  const {
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
    selectedPlan,
    planInstallments,
    planActivities: planDetailActivities,
    isLoadingInstallments,
    isLoadingActivities,
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
  } = planQuickAccess;

  const fetchPaymentLinkData = async (paymentLinkId: string): Promise<number | undefined> => {
    try {
      const { data: paymentLinkData, error: paymentLinkError } = await supabase
      .from('payment_links')
      .select(`
        amount
      `)
      .eq('id', paymentLinkId)
      .single();

      if (paymentLinkError) {
        console.error('Error fetching payment link data:', paymentLinkError);
        return undefined;
      }

      return paymentLinkData.amount;
    } catch(error: any) {
      console.error('Error fetching payment link data:', error);
      return undefined;
    }
  }

  // Fetch patient payment history
  useEffect(() => {
    const fetchPatientHistory = async () => {
      if (!patient.id || !open) return;
      
      setIsLoading(true);
      
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
            payment_links(type, title),
            payment_link_id
          `)
          .eq('patient_id', patient.id)
          .is('paid_at', null) // Only get unpaid requests
          .order('sent_at', { ascending: false });
        
        if (requestsError) throw requestsError;
        
        // Format completed payments
        const formattedPayments = paymentsData.map((payment: any) => ({
          id: payment.id,
          date: payment.paid_at, // Full ISO timestamp
          reference: payment.payment_ref,
          type: payment.payment_links?.type || 'other',
          title: payment.payment_links?.title,
          amount: payment.amount_paid || 0, // Default to 0 if null
          status: payment.status
        }));
        
        // Format payment requests - filter out £0 amounts
        const formattedRequests = await Promise.all(
          requestsData.map(async (request) => {
            let amount = request.custom_amount;
        
            if (amount === undefined || amount === null) {
              console.log('yes we are here');
              amount = await fetchPaymentLinkData(request.payment_link_id);
              console.log('amount', amount);
            }
        
            return {
              id: request.id,
              date: request.sent_at, // Full ISO timestamp
              reference: null,
              type: request.payment_links?.type || 'custom',
              title: request.payment_links?.title || 'Custom Payment',
              amount: amount,
              status: 'sent',
              paymentUrl: `https://clinipay.co.uk/payment/${request.id}`
            };
          })
        );
        
        const filteredRequests = formattedRequests.filter(request => request.amount && request.amount > 0);        
        // Combine and sort by date (newest first)
        const combinedHistory = [...formattedPayments, ...filteredRequests].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // Newest first
        });
        
        setPatientPayments(combinedHistory);
      } catch (err: any) {
        console.error('Error fetching patient history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientHistory();
  }, [patient.id, open, showPlanDetails]);


  // Fetch plan activities
  useEffect(() => {
    const fetchPlanActivities = async () => {
      if (!patient.id || !open) return;
      
      setLoadingActivities(true);
      
      try {
        // Modified to only fetch activities not associated with any plan
        // This prevents duplicate activities from showing up
        const { data, error } = await supabase
          .from('payment_activity')
          .select('*')
          .eq('patient_id', patient.id)
          .is('plan_id', null) // Only get activities not associated with any plan
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
  }, [patient.id, open, showPlanDetails]);
  
  useEffect(() => {
    // Update current patient when patient prop changes
    setCurrentPatient(patient);
  }, [patient]);

  const handlePatientUpdated = async () => {
    // Refresh patient data
    if (!currentPatient.id) return;
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', currentPatient.id)
        .single();
        
      if (error) throw error;
      
      setCurrentPatient(data as Patient);
    } catch (err) {
      console.error('Failed to refresh patient data:', err);
    }
  };
  
  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-y-auto p-0">
          <div className="p-6">
            <SheetHeader className="text-left mb-6">
              <div className="flex justify-between items-center">
                <SheetTitle className="text-2xl flex items-center">
                  {currentPatient.name}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowEditDialog(true)}
                    title="Edit Patient"
                    className="ml-2 h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </SheetTitle>
              </div>
              <p className="text-sm text-muted-foreground">Patient information and payment details</p>
            </SheetHeader>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                
                {currentPatient.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>{currentPatient.email}</span>
                  </div>
                )}
                
                {currentPatient.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{currentPatient.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment Summary</h3>
                
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                  <span>Total Spent: <strong>{formatCurrency(currentPatient.totalSpent || 0)}</strong></span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>Last Payment: <strong>{currentPatient.lastPaymentDate ? new Date(currentPatient.lastPaymentDate).toLocaleDateString() : 'N/A'}</strong></span>
                </div>
              </div>
            </div>
            
            {/* Payment Plans */}
            <PatientPlans 
              patientId={currentPatient.id} 
              onViewPlanDetails={handleViewPlanDetails} 
            />
            
            <Separator className="my-6" />

            {/* Tabs for Notes / Activity */}
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
                  patientId={currentPatient.id}
                  clinicId={currentPatient.clinic_id || ''}
                />
              </TabsContent>
              
              <TabsContent value="activity">
                <PatientActivity 
                  payments={patientPayments} 
                  planActivities={planActivities} 
                  isLoading={isLoading || loadingActivities}
                />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Patient Dialog */}
      <EditPatientDialog
        patient={currentPatient}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handlePatientUpdated}
      />

      {/* Plan Details Dialog - now using the shared implementation */}
      <PlanDetailsDialog
        showPlanDetails={showPlanDetails}
        setShowPlanDetails={setShowPlanDetails}
        selectedPlan={selectedPlan}
        installments={planInstallments}
        activities={planDetailActivities}
        isLoadingActivities={isLoadingActivities}
        onSendReminder={() => {}} // Not needed for this view
        onViewPaymentDetails={() => {}} // Not needed for this view
        onCancelPlan={handleOpenCancelDialog}
        onPausePlan={handleOpenPauseDialog}
        onResumePlan={handleOpenResumeDialog}
        onReschedulePlan={handleOpenRescheduleDialog}
        isPlanPaused={isPlanPaused}
      />

      {/* Use the shared action dialogs component */}
      <PlanActionDialogs
        showCancelDialog={showCancelDialog}
        setShowCancelDialog={setShowCancelDialog}
        showPauseDialog={showPauseDialog}
        setShowPauseDialog={setShowPauseDialog}
        showResumeDialog={showResumeDialog}
        setShowResumeDialog={setShowResumeDialog}
        showRescheduleDialog={showRescheduleDialog}
        setShowRescheduleDialog={setShowRescheduleDialog}
        selectedPlan={selectedPlan}
        handleCancelPlan={handleCancelPlan}
        handlePausePlan={handlePausePlan}
        handleResumePlan={handleResumePlan}
        handleReschedulePlan={handleReschedulePlan}
        isProcessing={isProcessing}
      />
    </>
  );
};

export default PatientDetailsDialog;
