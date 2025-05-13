
import { useState, useMemo } from 'react';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { PaymentLink } from '@/types/payment';

export function useFilteredPaymentLinks() {
  const { links, archivedLinks, loading, error, archiveLink, unarchiveLink, refresh } = usePaymentLinks();
  const [searchQuery, setSearchQuery] = useState('');
  const [linkType, setLinkType] = useState('all');
  const [isArchiveView, setIsArchiveView] = useState(false);

  const filteredLinks = useMemo(() => {
    // Get active or archived links based on the current view
    const linksToFilter = isArchiveView ? archivedLinks : links;

    return linksToFilter.filter(link => {
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
  }, [links, archivedLinks, searchQuery, linkType, isArchiveView]);

  return {
    filteredLinks,
    isLoading: loading,
    error,
    searchQuery,
    setSearchQuery,
    linkType,
    setLinkType,
    isArchiveView,
    setIsArchiveView,
    archivePaymentLink: archiveLink,
    unarchivePaymentLink: unarchiveLink,
    fetchPaymentLinks: refresh
  };
}
