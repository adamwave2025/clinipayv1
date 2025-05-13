
import { useState, useMemo } from 'react';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { PaymentLink } from '@/types/payment';

export function useFilteredPaymentLinks() {
  const { paymentLinks, archivedLinks, isLoading, error, archivePaymentLink, unarchivePaymentLink, fetchPaymentLinks } = usePaymentLinks();
  const [searchQuery, setSearchQuery] = useState('');
  const [linkType, setLinkType] = useState('all');
  const [isArchiveView, setIsArchiveView] = useState(false);

  const filteredLinks = useMemo(() => {
    // Get active or archived links based on the current view
    const links = isArchiveView ? archivedLinks : paymentLinks;

    return links.filter(link => {
      // Filter by search query
      const matchesSearch = 
        !searchQuery || 
        link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by link type
      const matchesType = 
        linkType === 'all' || 
        link.type?.toLowerCase() === linkType.toLowerCase();
        
      // Filter out payment plans from the reusable links section
      const isNotPaymentPlan = !link.paymentPlan;

      return matchesSearch && matchesType && isNotPaymentPlan;
    });
  }, [paymentLinks, archivedLinks, searchQuery, linkType, isArchiveView]);

  return {
    filteredLinks,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    linkType,
    setLinkType,
    isArchiveView,
    setIsArchiveView,
    archivePaymentLink,
    unarchivePaymentLink,
    fetchPaymentLinks
  };
}
