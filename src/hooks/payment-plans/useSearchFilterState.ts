
import { useState } from 'react';

export const useSearchFilterState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  return {
    searchQuery,
    setSearchQuery,
    statusFilter, 
    setStatusFilter
  };
};
