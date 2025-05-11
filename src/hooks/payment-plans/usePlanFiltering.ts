
import { useMemo } from 'react';
import { Plan } from '@/utils/planTypes';
import { useSearchFilterState } from './useSearchFilterState';

/**
 * Hook for filtering plans based on search query and status filter
 */
export const usePlanFiltering = (allPlans: Plan[]) => {
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter } = useSearchFilterState();
  
  // Apply filters to get the filtered plans
  const plans = useMemo(() => {
    console.log('Filtering plans. All plans:', allPlans.length);
    console.log('Status filter:', statusFilter);
    console.log('Search query:', searchQuery);
    
    let filtered = [...allPlans];
    
    // First apply status filter if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan => plan.status === statusFilter);
    }
    
    // Then apply search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(plan => {
        // Use patientName directly instead of checking nested properties
        const patientName = plan.patientName || '';
        return patientName.toLowerCase().includes(query);
      });
    }
    
    console.log('Filtered plans:', filtered.length);
    return filtered;
  }, [allPlans, statusFilter, searchQuery]);

  return {
    plans,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter
  };
};
