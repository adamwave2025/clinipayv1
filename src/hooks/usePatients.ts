
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserClinicId } from '@/utils/userUtils';
import { toast } from 'sonner';

export interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  total_spent?: number;
  last_payment_date?: string;
  paymentCount?: number;
}

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const clinicId = await getUserClinicId();
      
      if (!clinicId) {
        setError('No clinic ID available');
        return [];
      }
      
      // Using a direct query instead of RPC to avoid TypeScript issue
      const { data, error: fetchError } = await supabase
        .from('patients')
        .select(`
          id,
          name,
          email,
          phone,
          clinic_id,
          created_at,
          updated_at,
          notes
        `)
        .eq('clinic_id', clinicId);
        
      if (fetchError) {
        setError(fetchError.message);
        throw fetchError;
      }
      
      // Fetch payment information separately
      // This is simplified - ideally create a proper DB view or function for this
      const patientData = data || [];
      const enhancedPatients: Patient[] = await Promise.all(
        patientData.map(async (patient) => {
          // Get payment data for patient
          const { data: paymentData } = await supabase
            .from('payments')
            .select('amount_paid, paid_at')
            .eq('patient_id', patient.id)
            .order('paid_at', { ascending: false });

          let total_spent = 0;
          let last_payment_date = null;
          let paymentCount = 0;
          
          if (paymentData && paymentData.length > 0) {
            paymentCount = paymentData.length;
            total_spent = paymentData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
            last_payment_date = paymentData[0].paid_at;
          }
          
          return {
            ...patient,
            total_spent,
            last_payment_date,
            paymentCount
          };
        })
      );
      
      setPatients(enhancedPatients);
      return enhancedPatients;
    } catch (e: any) {
      console.error('Error fetching patients:', e);
      setError(e.message || 'Failed to fetch patients');
      toast.error('Failed to load patients');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Rename refetchPatients to match what components are expecting
  const refetchPatients = fetchPatients;

  return {
    patients,
    isLoading, // renamed from isLoadingPatients to isLoading to match elsewhere
    error,
    fetchPatients,
    refetchPatients, // Added for compatibility
    setPatients
  };
};
