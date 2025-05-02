
import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import { usePayments } from '@/hooks/usePayments';
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

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentCount: number;
  totalSpent: number;
  lastPaymentDate: string;
}

interface PatientDetailsDialogProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
}

const PatientDetailsDialog = ({ patient, open, onClose }: PatientDetailsDialogProps) => {
  const { payments } = usePayments();
  
  // Get all payments for this patient
  const patientPayments = payments.filter(
    payment => payment.patientEmail?.toLowerCase() === patient.email.toLowerCase()
  );
  
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
            
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-gray-500" />
              <span>{patient.email}</span>
            </div>
            
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
              <span>Total Spent: <strong>{formatCurrency(patient.totalSpent)}</strong></span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span>Last Payment: <strong>{patient.lastPaymentDate}</strong></span>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Payment History</h3>
          
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
                      <TableCell>{payment.date}</TableCell>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsDialog;
