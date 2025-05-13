
import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';
import { PaymentLinkService } from '@/services/PaymentLinkService';
import { PaymentLink } from '@/types/payment';

export const usePaymentLinks = () => {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [archivedLinks, setArchivedLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { clinicId } = useUnifiedAuth();

  const fetchLinks = async (overrideClinicId?: string) => {
    const targetClinicId = overrideClinicId || clinicId;
    
    if (!targetClinicId) {
      console.warn('No clinic ID available for links');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the PaymentLinkService to fetch links
      const { activeLinks, archivedLinks: archivedData, error } = await PaymentLinkService.fetchLinks(targetClinicId);
      
      if (error) {
        throw error;
      }
      
      // Format both active and archived links
      const formattedActive = formatPaymentLinks(activeLinks || []);
      const formattedArchived = formatPaymentLinks(archivedData || []);
      
      setLinks(formattedActive);
      setArchivedLinks(formattedArchived);
      
    } catch (err: any) {
      console.error('Error fetching payment links:', err);
      setError(err.message || 'Failed to fetch payment links');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when component mounts or clinic ID changes
  useEffect(() => {
    if (clinicId) {
      fetchLinks();
    }
  }, [clinicId]);

  const archiveLink = async (linkId: string): Promise<boolean> => {
    try {
      const result = await PaymentLinkService.archiveLink(linkId);
      if (result.success) {
        // Update the local state after archiving
        await fetchLinks();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error archiving link:', err);
      return false;
    }
  };

  const unarchiveLink = async (linkId: string): Promise<boolean> => {
    try {
      const result = await PaymentLinkService.unarchiveLink(linkId);
      if (result.success) {
        // Update the local state after unarchiving
        await fetchLinks();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error unarchiving link:', err);
      return false;
    }
  };

  const refresh = () => {
    fetchLinks();
  };

  return { 
    links, 
    archivedLinks, 
    loading, 
    error,
    archiveLink,
    unarchiveLink,
    refresh
  };
};
