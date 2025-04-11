
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ClinicProfileData = {
  id: string;
  clinic_name: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  logo_url: string | null;
  stripe_account_id: string | null;
  stripe_status: string | null;
  created_at: string | null;
};

export type ClinicStats = {
  totalPayments: number;
  totalAmount: number;
  totalRefunds: number;
  refundAmount: number;
  feesCollected: number;
  averagePayment: number;
};

export type ClinicPayment = {
  id: string;
  patientName: string;
  amount: number;
  date: string;
  status: string;
};

export type ClinicLink = {
  id: string;
  name: string;
  created: string;
  usageCount: number;
};

export function useClinicProfile(clinicId: string) {
  const [clinic, setClinic] = useState<ClinicProfileData | null>(null);
  const [stats, setStats] = useState<ClinicStats>({
    totalPayments: 0,
    totalAmount: 0,
    totalRefunds: 0,
    refundAmount: 0,
    feesCollected: 0,
    averagePayment: 0
  });
  const [recentPayments, setRecentPayments] = useState<ClinicPayment[]>([]);
  const [links, setLinks] = useState<ClinicLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClinicProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch basic clinic data
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (clinicError) throw clinicError;
      
      setClinic(clinicData);
      
      // Fetch payments data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('clinic_id', clinicId);

      if (paymentsError) throw paymentsError;
      
      if (paymentsData.length > 0) {
        // Calculate payment statistics
        const totalPaymentsCount = paymentsData.length;
        const totalAmount = paymentsData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
        
        // Calculate refund statistics
        const refundsData = paymentsData.filter(payment => 
          payment.status === 'refunded' || payment.status === 'partially_refunded'
        );
        const totalRefundsCount = refundsData.length;
        const refundAmount = refundsData.reduce((sum, payment) => sum + (payment.refund_amount || 0), 0);
        
        // Calculate platform fee (3% by default, should be fetched from settings in a production app)
        const platformFeePercentage = 0.03;
        const feesCollected = totalAmount * platformFeePercentage;
        
        // Calculate average payment
        const averagePayment = totalPaymentsCount > 0 ? totalAmount / totalPaymentsCount : 0;
        
        setStats({
          totalPayments: totalPaymentsCount,
          totalAmount,
          totalRefunds: totalRefundsCount,
          refundAmount,
          feesCollected,
          averagePayment
        });
        
        // Format recent payments
        const formattedPayments = paymentsData
          .slice(0, 5) // Get only the 5 most recent
          .map(payment => ({
            id: payment.id,
            patientName: payment.patient_name || 'Unknown Patient',
            amount: payment.amount_paid || 0,
            date: payment.paid_at || new Date().toISOString(),
            status: payment.status || 'unknown'
          }));
        
        setRecentPayments(formattedPayments);
      }
      
      // Fetch payment links
      const { data: linksData, error: linksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', clinicId);

      if (linksError) throw linksError;
      
      if (linksData.length > 0) {
        // Format payment links
        const formattedLinks = await Promise.all(linksData.map(async (link) => {
          // Count how many times this link was used
          const { count, error: countError } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('payment_link_id', link.id);
          
          return {
            id: link.id,
            name: link.title || 'Unnamed Link',
            created: link.created_at || new Date().toISOString(),
            usageCount: count || 0
          };
        }));
        
        setLinks(formattedLinks);
      }
    } catch (error: any) {
      console.error('Error fetching clinic profile:', error);
      setError(error.message || 'Failed to load clinic profile');
      toast.error('Failed to load clinic profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchClinicProfile();
    }
  }, [clinicId]);

  return {
    clinic,
    stats,
    recentPayments,
    links,
    isLoading,
    error,
    refetch: fetchClinicProfile
  };
}
