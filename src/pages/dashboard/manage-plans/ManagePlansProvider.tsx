
import React from 'react';
import { ManagePlansProvider as CoreManagePlansProvider } from '@/contexts/ManagePlansProvider';
import ManagePlansContext from '@/contexts/ManagePlansContext';

interface ManagePlansProviderProps {
  children: React.ReactNode;
}

export const ManagePlansProvider: React.FC<ManagePlansProviderProps> = ({ children }) => {
  return (
    <CoreManagePlansProvider>
      {children}
    </CoreManagePlansProvider>
  );
};

export default ManagePlansProvider;
