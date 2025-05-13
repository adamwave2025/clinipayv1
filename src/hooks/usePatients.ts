
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  total_spent: number;
  last_payment_date: string | null;
  created_at: string;
  updated_at: string;
  clinic_id: string;
  paymentCount?: number;
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, clinicId } = useUnifiedAuth();

  const fetchPatients = async () => {
    if (!user || !clinicId) {
      console.log('No user or clinicId available', { user, clinicId });
      setIsLoadingPatients(false);
      return;
    }

    setIsLoadingPatients(true);
    setError(null);

    try {
      // Fetch patients with their total payments
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('name');

      if (patientsError) throw patientsError;

      // Calculate total spent per patient (would be better as a DB function or view)
      const patientsWithPayments: Patient[] = await Promise.all(
        patientsData.map(async (patient) => {
          // Get total payments for this patient
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('payments')
            .select('amount_paid, paid_at')
            .eq('patient_id', patient.id)
            .eq('status', 'paid')
            .order('paid_at', { ascending: false });

          if (paymentsError) throw paymentsError;

          const total_spent = paymentsData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
          const last_payment_date = paymentsData.length > 0 ? paymentsData[0].paid_at : null;

          return {
            ...patient,
            total_spent,
            last_payment_date,
            paymentCount: paymentsData.length
          };
        })
      );

      setPatients(patientsWithPayments);
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      setError(err.message || 'Failed to load patients');
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const refetchPatients = () => {
    fetchPatients();
  };

  useEffect(() => {
    if (clinicId) {
      fetchPatients();
    }
  }, [clinicId]);

  return { patients, isLoadingPatients, error, refetchPatients };
}
