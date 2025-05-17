
import { useContext } from 'react';
import ManagePlansContext from '@/contexts/ManagePlansContext';

export const useManagePlans = () => {
  const context = useContext(ManagePlansContext);
  
  if (!context) {
    throw new Error('useManagePlans must be used within a ManagePlansProvider');
  }
  
  return context;
};
