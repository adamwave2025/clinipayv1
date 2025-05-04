
import React from 'react';
import ManagePlansContext from '@/contexts/ManagePlansContext';
import { useManagePlans } from '@/hooks/useManagePlans';

interface ManagePlansProviderProps {
  children: React.ReactNode;
}

export const ManagePlansProvider: React.FC<ManagePlansProviderProps> = ({ children }) => {
  const managePlansState = useManagePlans();
  
  return (
    <ManagePlansContext.Provider value={managePlansState}>
      {children}
    </ManagePlansContext.Provider>
  );
};
