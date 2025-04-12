
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';
import { PaymentLinkApi } from '@/services/PaymentLinkApi';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';

export function usePaymentLinks() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [archivedLinks, setArchivedLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPaymentLinks = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { activeLinks, archivedLinks, clinicId } = await PaymentLinkApi.fetchLinks(user.id);
      
      setPaymentLinks(formatPaymentLinks(activeLinks));
      setArchivedLinks(formatPaymentLinks(archivedLinks));
      setClinicId(clinicId);
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
      const result = await PaymentLinkApi.toggleArchiveStatus(linkId, true);
      
      if (!result.success) {
        throw new Error(result.error);
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
      const result = await PaymentLinkApi.toggleArchiveStatus(linkId, false);
      
      if (!result.success) {
        throw new Error(result.error);
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
    if (!user || !clinicId) {
      toast.error('You must be logged in to create payment links');
      return { success: false };
    }

    try {
      const result = await PaymentLinkApi.createPaymentLink(linkData, clinicId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const formattedLink = formatPaymentLinks([result.data])[0];
      
      // Refresh the payment links list
      await fetchPaymentLinks();
      
      return { 
        success: true, 
        paymentLink: formattedLink
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
