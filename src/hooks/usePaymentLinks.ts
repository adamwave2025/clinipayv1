
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { PaymentLinkService } from '@/modules/payment/services/PaymentLinkService';
import { toast } from 'sonner';

export function usePaymentLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [archivedLinks, setArchivedLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clinicId } = useUnifiedAuth();

  const fetchLinks = async () => {
    if (!clinicId) {
      console.log('No clinicId available, skipping link fetch');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const activeLinks = await PaymentLinkService.getActiveLinks(clinicId);
      const archivedLinksData = await PaymentLinkService.getArchivedLinks(clinicId);
      
      setLinks(activeLinks);
      setArchivedLinks(archivedLinksData);
    } catch (err: any) {
      console.error('Error fetching payment links:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const archiveLink = async (linkId: string) => {
    try {
      const result = await PaymentLinkService.archiveLink(linkId);
      
      if (result.success) {
        toast.success('Payment link archived successfully');
        fetchLinks(); // Refresh the links
        return true;
      } else {
        toast.error(result.error || 'Failed to archive payment link');
        return false;
      }
    } catch (error: any) {
      toast.error(`Error archiving payment link: ${error.message}`);
      console.error('Error archiving payment link:', error);
      return false;
    }
  };

  const unarchiveLink = async (linkId: string) => {
    try {
      const result = await PaymentLinkService.unarchiveLink(linkId);
      
      if (result.success) {
        toast.success('Payment link restored successfully');
        fetchLinks(); // Refresh the links
        return true;
      } else {
        toast.error(result.error || 'Failed to restore payment link');
        return false;
      }
    } catch (error: any) {
      toast.error(`Error restoring payment link: ${error.message}`);
      console.error('Error restoring payment link:', error);
      return false;
    }
  };

  const createPaymentLink = async (linkData: any) => {
    try {
      const result = await PaymentLinkService.createPaymentLink(linkData);
      
      if (result.success) {
        toast.success('Payment link created successfully');
        fetchLinks(); // Refresh the links
        return { success: true, data: result.data };
      } else {
        toast.error(result.error || 'Failed to create payment link');
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      toast.error(`Error creating payment link: ${error.message}`);
      console.error('Error creating payment link:', error);
      return { success: false, error: error.message };
    }
  };

  const refresh = () => {
    fetchLinks();
  };

  // Fetch links when clinicId changes
  useEffect(() => {
    if (clinicId) {
      fetchLinks();
    }
  }, [clinicId]);

  return {
    links,
    archivedLinks,
    loading,
    error,
    archiveLink,
    unarchiveLink,
    refresh,
    createPaymentLink
  };
}
