
import React from 'react';
import { useManagePlans } from '@/hooks/useManagePlans';
import ManagePlansContext, { ManagePlansContextType } from '@/contexts/ManagePlansContext';

interface ManagePlansProviderProps {
  children: React.ReactNode;
}

export const ManagePlansProvider: React.FC<ManagePlansProviderProps> = ({ children }) => {
  const managePlansState: ManagePlansContextType = useManagePlans();
  
  return (
    <ManagePlansContext.Provider value={managePlansState}>
      {children}
    </ManagePlansContext.Provider>
  );
};
