
import React from 'react';
import ManagePlansContext from '@/contexts/ManagePlansContext';
import { useManagePlans } from '@/hooks/useManagePlans';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';

interface ManagePlansProviderProps {
  children: React.ReactNode;
}

export const ManagePlansProvider: React.FC<ManagePlansProviderProps> = ({ children }) => {
  const managePlansState = useManagePlans();
  
  return (
    <DashboardDataProvider>
      <ManagePlansContext.Provider value={managePlansState}>
        {children}
      </ManagePlansContext.Provider>
    </DashboardDataProvider>
  );
};
