
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  paymentCount?: number;
  totalSpent?: number;
  lastPaymentDate?: string;
  pendingRequestsCount?: number; // Number of pending payment requests
  clinic_id?: string; // Added clinic_id property to fix TypeScript error
}

export function usePatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch patients data
  const fetchPatients = useCallback(async () => {
    if (!user) {
      setIsLoadingPatients(false);
      return;
    }
    
    setIsLoadingPatients(true);
    setError(null);
    
    try {
      // Get user's clinic_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();
      
      if (userError) throw userError;
      if (!userData.clinic_id) {
        setIsLoadingPatients(false);
        setPatients([]);
        return;
      }
      
      // Fetch patients for this clinic
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', userData.clinic_id)
        .order('name');
        
      if (patientsError) throw patientsError;
      
      // Fetch payment statistics for each patient
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('patient_id, amount_paid, paid_at')
        .eq('clinic_id', userData.clinic_id);
        
      if (paymentsError) throw paymentsError;
      
      // Fetch payment requests data
      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select('patient_id, custom_amount, sent_at, status, payment_link_id, payment_links(amount)')
        .eq('clinic_id', userData.clinic_id);
        
      if (requestsError) throw requestsError;
      
      // Process payment data to calculate statistics for each patient
      const paymentStats = paymentsData.reduce((stats: Record<string, any>, payment) => {
        if (!payment.patient_id) return stats;
        
        if (!stats[payment.patient_id]) {
          stats[payment.patient_id] = {
            paymentCount: 0,
            totalSpent: 0,
            lastPaymentDate: null,
            pendingRequestsCount: 0
          };
        }
        
        const stat = stats[payment.patient_id];
        stat.paymentCount += 1;
        stat.totalSpent += payment.amount_paid || 0;
        
        const paymentDate = new Date(payment.paid_at);
        if (!stat.lastPaymentDate || paymentDate > new Date(stat.lastPaymentDate)) {
          stat.lastPaymentDate = payment.paid_at;
        }
        
        return stats;
      }, {});
      
      // Process payment requests data
      requestsData.forEach(request => {
        if (!request.patient_id) return;
        
        if (!paymentStats[request.patient_id]) {
          paymentStats[request.patient_id] = {
            paymentCount: 0,
            totalSpent: 0,
            lastPaymentDate: null,
            pendingRequestsCount: 0
          };
        }
        
        // Only count pending requests
        if (request.status === 'sent') {
          paymentStats[request.patient_id].pendingRequestsCount += 1;
        }
      });
      
      // Combine patient data with their payment statistics
      const enhancedPatients = patientsData.map((patient: Patient) => ({
        ...patient,
        paymentCount: paymentStats[patient.id]?.paymentCount || 0,
        totalSpent: paymentStats[patient.id]?.totalSpent || 0,
        lastPaymentDate: paymentStats[patient.id]?.lastPaymentDate || null,
        pendingRequestsCount: paymentStats[patient.id]?.pendingRequestsCount || 0
      }));
      
      setPatients(enhancedPatients);
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      setError(err.message || 'Failed to load patients');
    } finally {
      setIsLoadingPatients(false);
    }
  }, [user]);
  
  // Fetch patients data on component mount and when user changes
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  return {
    patients,
    isLoadingPatients,
    error,
    refetchPatients: fetchPatients
  };
}
