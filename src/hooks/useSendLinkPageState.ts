
import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { usePaymentLinks } from './usePaymentLinks';
import { useClinicData } from './useClinicData';
import { PaymentLink } from '@/types/payment';

export function useSendLinkPageState() {
  const { clinicId } = useUnifiedAuth();
  const { links, loading, error, refresh } = usePaymentLinks();
  const { clinicData, isLoading: isLoadingClinic } = useClinicData();
  const [paymentLinkOptions, setPaymentLinkOptions] = useState<PaymentLink[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // Process payment links when they're loaded
  useEffect(() => {
    if (!loading && links.length > 0) {
      // Filter out payment plan links (if needed)
      const filteredLinks = links.filter(link => !link.payment_plan);
      setPaymentLinkOptions(filteredLinks);
      
      // Auto-select first link if none selected and options exist
      if (!selectedLinkId && filteredLinks.length > 0) {
        setSelectedLinkId(filteredLinks[0].id);
      }
    }
  }, [links, loading, selectedLinkId]);

  // Get the selected link object
  const selectedLink = paymentLinkOptions.find(link => link.id === selectedLinkId) || null;
  
  return {
    paymentLinkOptions,
    selectedLinkId,
    setSelectedLinkId,
    selectedLink,
    isLoading: loading || isLoadingClinic,
    error,
    clinicData,
    refresh
  };
}
