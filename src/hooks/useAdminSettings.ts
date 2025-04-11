import { usePlatformFeeManager } from './usePlatformFeeManager';
import { useClinicsList } from './useClinicsList';

export const useAdminSettings = () => {
  const { platformFee, setPlatformFee, fetchPlatformFee } = usePlatformFeeManager();
  const { clinics, setClinics, isLoading, fetchClinics } = useClinicsList();

  return {
    platformFee,
    setPlatformFee,
    clinics,
    setClinics,
    isLoading,
    fetchPlatformFee,
    fetchClinics
  };
};

// This hook is used in other components, so we'll keep it
export const usePlatformFee = () => {
  const { platformFee, fetchPlatformFee } = usePlatformFeeManager();
  const isLoading = false; // This is simplified from the original implementation

  return { platformFee, isLoading };
};
