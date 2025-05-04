
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';
import { PaymentLinkService } from '@/services/PaymentLinkService';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';

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
      const result = await PaymentLinkService.fetchLinks(user.id);
      
      setPaymentLinks(formatPaymentLinks(result.activeLinks));
      setArchivedLinks(formatPaymentLinks(result.archivedLinks));
      setClinicId(result.clinicId);
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
      const result = await PaymentLinkService.archivePaymentLink(linkId);
      
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
      const result = await PaymentLinkService.unarchivePaymentLink(linkId);
      
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
    if (!user || !clinicId) {
      toast.error('You must be logged in to create payment links');
      return { success: false };
    }

    try {
      const result = await PaymentLinkService.createLink(linkData, clinicId);
      
      if (!result) {
        throw new Error('Failed to create payment link');
      }
      
      const formattedLink = formatPaymentLinks([result])[0];
      
      // Refresh the payment links list
      await fetchPaymentLinks();
      
      return { 
        success: true, 
        paymentLink: formattedLink,
        data: result
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
