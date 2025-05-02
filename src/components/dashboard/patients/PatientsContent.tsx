
import React, { useState, useMemo } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { Card, CardContent } from '@/components/ui/card';
import PatientsTable from './PatientsTable';
import PatientDetailsDialog from './PatientDetailsDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentCount: number;
  totalSpent: number;
  lastPaymentDate: string;
}

const PatientsContent = () => {
  const { payments, isLoadingPayments } = usePayments();
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Generate a unique list of patients from payment data
  const patients = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const patientMap = new Map<string, Patient>();
    
    payments.forEach(payment => {
      if (!payment.patientName || !payment.patientEmail) return;
      
      // Create a unique ID from email to avoid duplicates
      const patientId = payment.patientEmail.toLowerCase();
      
      if (patientMap.has(patientId)) {
        // Update existing patient data
        const existing = patientMap.get(patientId)!;
        patientMap.set(patientId, {
          ...existing,
          paymentCount: existing.paymentCount + 1,
          totalSpent: existing.totalSpent + payment.amount,
          lastPaymentDate: new Date(payment.date) > new Date(existing.lastPaymentDate) 
            ? payment.date 
            : existing.lastPaymentDate
        });
      } else {
        // Add new patient
        patientMap.set(patientId, {
          id: patientId,
          name: payment.patientName,
          email: payment.patientEmail || '',
          phone: payment.patientPhone || '',
          paymentCount: 1,
          totalSpent: payment.amount,
          lastPaymentDate: payment.date
        });
      }
    });
    
    return Array.from(patientMap.values());
  }, [payments]);
  
  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    
    const searchTerm = search.toLowerCase();
    return patients.filter(
      patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        patient.email.toLowerCase().includes(searchTerm) ||
        patient.phone.toLowerCase().includes(searchTerm)
    );
  }, [patients, search]);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients by name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 input-focus w-full"
              />
            </div>
          </div>
          
          {isLoadingPayments ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <PatientsTable 
              patients={filteredPatients} 
              onPatientClick={handlePatientClick}
            />
          )}
        </CardContent>
      </Card>

      {selectedPatient && (
        <PatientDetailsDialog
          patient={selectedPatient}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default PatientsContent;
