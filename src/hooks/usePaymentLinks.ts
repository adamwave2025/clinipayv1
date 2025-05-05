
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';
import { PaymentLinkService } from '@/services/PaymentLinkService';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';
import { getUserClinicId } from '@/utils/userUtils';

// Type guard to check if result has an error property
const hasError = (result: { success: boolean } | { success: boolean; error: any }): 
  result is { success: boolean; error: any } => {
  return 'error' in result;
};

export function usePaymentLinks() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [archivedLinks, setArchivedLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPaymentLinks = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the clinic ID associated with this user
      const clinicId = await getUserClinicId();
      
      if (!clinicId) {
        throw new Error('Could not determine your clinic ID. Please contact support.');
      }
      
      const result = await PaymentLinkService.fetchLinks(clinicId);
      
      setPaymentLinks(formatPaymentLinks(result.activeLinks));
      setArchivedLinks(formatPaymentLinks(result.archivedLinks));
    } catch (error: any) {
      console.error('Error fetching payment links:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const archivePaymentLink = async (linkId: string) => {
    if (!user) {
      toast.error('You must be logged in to manage payment links');
      return { success: false };
    }

    setIsArchiveLoading(true);
    
    try {
      const result = await PaymentLinkService.archiveLink(linkId);
      
      if (!result.success) {
        // Use type guard to safely access error property
        const errorMessage = hasError(result) ? result.error : 'Unknown error';
        throw new Error(errorMessage);
      }
      
      toast.success('Payment link archived successfully');
      return { success: true };
    } catch (error: any) {
      toast.error(`Failed to archive payment link: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const unarchivePaymentLink = async (linkId: string) => {
    if (!user) {
      toast.error('You must be logged in to manage payment links');
      return { success: false };
    }

    setIsArchiveLoading(true);
    
    try {
      const result = await PaymentLinkService.unarchiveLink(linkId);
      
      if (!result.success) {
        // Use type guard to safely access error property
        const errorMessage = hasError(result) ? result.error : 'Unknown error';
        throw new Error(errorMessage);
      }
      
      toast.success('Payment link unarchived successfully');
      return { success: true };
    } catch (error: any) {
      toast.error(`Failed to unarchive payment link: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const createPaymentLink = async (linkData: Omit<PaymentLink, 'id' | 'url' | 'createdAt' | 'isActive'>) => {
    if (!user) {
      toast.error('You must be logged in to create payment links');
      return { success: false };
    }

    try {
      console.log('Original link data:', linkData);
      
      // Get the clinic ID associated with this user
      const clinicId = await getUserClinicId();
      
      if (!clinicId) {
        toast.error('Could not determine your clinic ID');
        return { success: false, error: 'Clinic ID not found' };
      }
      
      // Ensure paymentPlan is a boolean
      const isPaymentPlan = linkData.paymentPlan === true;
      
      // Convert camelCase to snake_case for database compatibility
      const dbLinkData: any = {
        title: linkData.title,
        amount: linkData.amount,
        type: linkData.type,
        description: linkData.description,
        payment_plan: isPaymentPlan, // Ensure this is a boolean
        clinic_id: clinicId // Use the fetched clinic ID
      };
      
      // Only add payment plan fields if it's a payment plan
      if (isPaymentPlan) {
        dbLinkData.payment_count = linkData.paymentCount;
        dbLinkData.payment_cycle = linkData.paymentCycle;
        dbLinkData.plan_total_amount = linkData.planTotalAmount;
      }
      
      console.log('Converting to database format:', dbLinkData);
      
      const result = await PaymentLinkService.createLink(dbLinkData);
      
      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to create payment link');
      }
      
      const formattedLink = formatPaymentLinks([result.data[0]])[0];
      
      // Refresh the payment links list
      await fetchPaymentLinks();
      
      return { 
        success: true, 
        paymentLink: formattedLink,
        data: result.data[0]
      };
    } catch (error: any) {
      toast.error(`Failed to create payment link: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchPaymentLinks();
  }, [user]);

  return {
    paymentLinks,
    archivedLinks,
    isLoading,
    isArchiveLoading,
    error,
    fetchPaymentLinks,
    createPaymentLink,
    archivePaymentLink,
    unarchivePaymentLink
  };
}
