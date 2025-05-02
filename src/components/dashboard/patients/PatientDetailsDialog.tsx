
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

interface Payment {
  id: string;
  date: string;
  reference: string | null;
  type: string;
  amount: number;
  status: string;
}

interface PatientDetailsDialogProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
}

const PatientDetailsDialog = ({ patient, open, onClose }: PatientDetailsDialogProps) => {
  const [patientPayments, setPatientPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientPayments = async () => {
      if (!patient.id || !open) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('payments')
          .select(`
            id,
            paid_at,
            amount_paid,
            status,
            payment_ref,
            payment_links(type)
          `)
          .eq('patient_id', patient.id)
          .order('paid_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        const formattedPayments = data.map((payment: any) => ({
          id: payment.id,
          date: payment.paid_at,
          reference: payment.payment_ref,
          type: payment.payment_links?.type || 'other',
          amount: payment.amount_paid,
          status: payment.status
        }));
        
        setPatientPayments(formattedPayments);
      } catch (err: any) {
        console.error('Error fetching patient payments:', err);
        setError('Failed to load payment history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientPayments();
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
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
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
                        <TableCell>{payment.reference || 'N/A'}</TableCell>
                        <TableCell>{payment.type}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                            payment.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                            payment.status === 'partially_refunded' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status === 'paid' ? 'Paid' :
                             payment.status === 'refunded' ? 'Refunded' :
                             payment.status === 'partially_refunded' ? 'Partially Refunded' :
                             'Sent'}
                          </span>
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
