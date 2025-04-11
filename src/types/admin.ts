
/**
 * Interface representing a clinic with Stripe integration status
 */
export interface Clinic {
  id: string;
  clinic_name: string | null;
  email: string | null;
  stripe_account_id: string | null;
  stripe_status: string | null;
}

/**
 * Props for the StripeClinicRow component
 */
export interface StripeClinicRowProps {
  clinic: Clinic;
  onDisconnect: (clinicId: string) => void;
}

/**
 * Props for the StripeConnectManagement component
 */
export interface StripeConnectManagementProps {
  clinics: Clinic[];
  isLoading: boolean;
  onUpdateClinics: (updatedClinics: Clinic[]) => void;
  refetchClinics: () => Promise<void>;
}

/**
 * Props for the DisconnectDialog component
 */
export interface DisconnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDisconnecting: boolean;
  error: string | null;
}
