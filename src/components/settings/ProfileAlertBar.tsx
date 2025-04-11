
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClinicData } from '@/services/ClinicDataService';

interface ProfileAlertBarProps {
  clinicData: Partial<ClinicData> | null;
}

// Helper function to check if profile is complete
export const isProfileComplete = (data: Partial<ClinicData> | null): boolean => {
  if (!data) return false;
  
  // Check if logo and all required fields are filled
  return !!(
    data.logo_url &&
    data.clinic_name &&
    data.email &&
    data.phone &&
    data.address_line_1 &&
    data.city &&
    data.postcode
  );
};

const ProfileAlertBar = ({ clinicData }: ProfileAlertBarProps) => {
  // If profile is complete, don't show the alert
  if (isProfileComplete(clinicData)) {
    return null;
  }

  return (
    <Alert className="mb-6 bg-gradient-to-r from-purple-100 to-purple-200 border-purple-300 text-purple-800">
      <AlertTriangle className="h-5 w-5 text-purple-600" />
      <AlertDescription className="ml-2">
        Add your clinic logo and details to give patients the best payment experience!
      </AlertDescription>
    </Alert>
  );
};

export default ProfileAlertBar;
