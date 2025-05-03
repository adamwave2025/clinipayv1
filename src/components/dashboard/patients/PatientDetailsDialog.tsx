
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
import { Plan, PlanInstallment } from '@/utils/paymentPlanUtils';
import { groupPaymentSchedulesByPlan, formatPlanInstallments } from '@/utils/paymentPlanUtils';
import { fetchPaymentSchedules } from '@/services/PaymentScheduleService';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('payments');
  
  // Added for Payment Plans section
  const [patientPlans, setPatientPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planInstallments, setPlanInstallments] = useState<PlanInstallment[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

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
        
        // Format completed payments
        const formattedPayments = paymentsData.map((payment: any) => ({
          id: payment.id,
          date: payment.paid_at,
          reference: payment.payment_ref,
          type: payment.payment_links?.type || 'other',
          title: payment.payment_links?.title,
          amount: payment.amount_paid || 0, // Default to 0 if null
          status: payment.status
        }));
        
        // Format payment requests - filter out £0 amounts
        const formattedRequests = requestsData
          .map((request: any) => {
            const amount = request.custom_amount || (request.payment_links ? request.payment_links.amount : 0);
            return {
              id: request.id,
              date: request.sent_at,
              reference: null,
              type: request.payment_links?.type || 'custom',
              title: request.payment_links?.title || 'Custom Payment',
              amount: amount, 
              status: 'sent' as const,
              paymentUrl: `https://clinipay.co.uk/payment/${request.id}`
            };
          })
          .filter(request => request.amount > 0); // Filter out zero amounts
        
        // Combine and sort by date (newest first)
        const combinedHistory = [...formattedPayments, ...formattedRequests].sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setPatientPayments(combinedHistory);
      } catch (err: any) {
        console.error('Error fetching patient history:', err);
        setError('Failed to load payment history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientHistory();
  }, [patient.id, open]);

  // New useEffect for fetching patient payment plans
  useEffect(() => {
    const fetchPatientPaymentPlans = async () => {
      if (!patient.id || !open) return;
      
      setLoadingPlans(true);
      
      try {
        // Get user's clinic_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('clinic_id')
          .eq('id', patient.id)
          .maybeSingle();

        if (userError) throw userError;
        const clinicId = userData?.clinic_id;
        
        if (!clinicId) {
          setLoadingPlans(false);
          return;
        }

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
  }, [patient.id, open]);

  // Function to handle viewing plan details
  const handleViewPlanDetails = async (plan: Plan) => {
    setSelectedPlan(plan);
    
    try {
      const [patientId, paymentLinkId] = plan.id.split('_');
      
      if (!patientId || !paymentLinkId) {
        throw new Error('Invalid plan ID');
      }
      
      // Fetch installments for this plan from Supabase
      const { data: rawInstallments, error } = await supabase
        .from('payment_schedule')
        .select(`
          id,
          amount,
          due_date,
          payment_number,
          total_payments,
          status,
          payment_request_id,
          payment_requests (
            id,
            payment_id,
            paid_at,
            status
          )
        `)
        .eq('patient_id', patientId)
        .eq('payment_link_id', paymentLinkId)
        .order('payment_number', { ascending: true });
        
      if (error) throw error;
      
      // Format installments for display
      const formattedInstallments = formatPlanInstallments(rawInstallments);
      setPlanInstallments(formattedInstallments);
      setShowPlanDetails(true);
    } catch (err) {
      console.error('Error fetching plan details:', err);
    }
  };

  // Function to determine if a plan is paused
  const isPlanPaused = (plan: Plan | null) => {
    if (!plan) return false;
    return plan.status === 'paused';
  };

  // Function to go back from plan details to plans list
  const handleBackToPlans = () => {
    setShowPlanDetails(false);
  };
  
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-y-auto p-0">
        <div className="p-6">
          {/* Header with back button when showing plan details */}
          {showPlanDetails ? (
            <div className="flex items-center mb-4">
              <Button variant="ghost" size="sm" onClick={handleBackToPlans} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Plans
              </Button>
            </div>
          ) : (
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-2xl">{patient.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">Patient information and payment details</p>
            </SheetHeader>
          )}

          {!showPlanDetails ? (
            <>
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
              
              <Separator className="my-6" />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="payments">Payment History</TabsTrigger>
                  <TabsTrigger value="plans">Payment Plans</TabsTrigger>
                </TabsList>
                
                <TabsContent value="payments">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Payment History</h3>
                    
                    {isLoading ? (
                      <div className="flex justify-center py-6">
                        <LoadingSpinner />
                      </div>
                    ) : error ? (
                      <div className="text-center py-4 text-red-500">
                        {error}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {patientPayments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                  No payments found
                                </TableCell>
                              </TableRow>
                            ) : (
                              patientPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell>{formatDate(payment.date)}</TableCell>
                                  <TableCell>
                                    {payment.title || payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                                  </TableCell>
                                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                  <TableCell>
                                    <StatusBadge status={payment.status} />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {payment.status === 'sent' && payment.paymentUrl && (
                                      <PaymentLinkActionsSection 
                                        status={payment.status}
                                        paymentUrl={payment.paymentUrl}
                                      />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="plans">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Payment Plans</h3>
                    
                    {loadingPlans ? (
                      <div className="flex justify-center py-6">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
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
                            {patientPlans.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                  No payment plans found
                                </TableCell>
                              </TableRow>
                            ) : (
                              patientPlans.map((plan) => (
                                <TableRow 
                                  key={plan.id}
                                  className="cursor-pointer hover:bg-muted"
                                  onClick={() => handleViewPlanDetails(plan)}
                                >
                                  <TableCell className="font-medium">{plan.planName}</TableCell>
                                  <TableCell>{formatCurrency(plan.amount)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" 
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
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : selectedPlan && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">{selectedPlan.planName}</h2>
                <p className="text-sm text-muted-foreground">
                  Payment plan details
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">{formatCurrency(selectedPlan.amount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <div className="flex items-center gap-2">
                    <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary rounded-full" 
                        style={{ width: `${selectedPlan.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {selectedPlan.paidInstallments}/{selectedPlan.totalInstallments}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedPlan.status as any} />
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2">Installments</h3>
                <div className="border rounded-md">
                  <ScrollArea className="h-[280px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Paid Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planInstallments.map((installment) => (
                          <TableRow 
                            key={installment.id}
                          >
                            <TableCell>{installment.dueDate}</TableCell>
                            <TableCell>{formatCurrency(installment.amount)}</TableCell>
                            <TableCell>
                              <StatusBadge status={installment.status as any} />
                            </TableCell>
                            <TableCell>{installment.paidDate || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PatientDetailsDialog;
