
import React, { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/hooks/usePatients';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import PaymentLinkActionsSection from '@/components/dashboard/payment-details/PaymentLinkActionsSection';

interface PatientPayment {
  id: string;
  date: string;
  reference: string | null;
  type: string;
  amount: number;
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
          amount: payment.amount_paid,
          status: payment.status
        }));
        
        // Format payment requests
        const formattedRequests = requestsData.map((request: any) => ({
          id: request.id,
          date: request.sent_at,
          reference: null,
          type: request.payment_links?.type || 'custom',
          title: request.payment_links?.title || 'Custom Payment',
          amount: request.custom_amount || (request.payment_links ? request.payment_links.amount : 0),
          status: 'sent' as const,
          paymentUrl: `https://clinipay.co.uk/payment/${request.id}`
        }));
        
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
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{patient.name}</DialogTitle>
          <DialogDescription>Patient information and payment history</DialogDescription>
        </DialogHeader>
        
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
        
        <Separator className="my-4" />
        
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
                          {payment.status === 'sent' && (
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
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsDialog;
