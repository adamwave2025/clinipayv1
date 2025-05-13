
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserClinicId } from '@/utils/userUtils';
import { toast } from 'sonner';

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  total_spent?: number;
  last_payment_date?: string;
  paymentCount?: number; // For compatibility with components
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
      
      // Query patients with payment information via RPC function
      const { data, error: fetchError } = await supabase
        .rpc('get_patients_with_payment_info', { clinic_id_param: clinicId });
        
      if (fetchError) {
        setError(fetchError.message);
        throw fetchError;
      }
      
      // Format the data to match our Patient interface
      const formattedPatients = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        clinic_id: p.clinic_id,
        created_at: p.created_at,
        updated_at: p.updated_at,
        notes: p.notes,
        total_spent: p.total_spent || 0,
        last_payment_date: p.last_payment_date,
        paymentCount: p.payment_count || 0
      }));
      
      setPatients(formattedPatients);
      return formattedPatients;
    } catch (e: any) {
      console.error('Error fetching patients:', e);
      setError(e.message || 'Failed to fetch patients');
      toast.error('Failed to load patients');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    patients,
    isLoading,
    error,
    fetchPatients,
    setPatients
  };
};
