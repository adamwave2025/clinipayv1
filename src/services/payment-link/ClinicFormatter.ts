
import { RawClinicData } from '@/types/paymentLink';

export const ClinicFormatter = {
  formatAddress(clinic: RawClinicData): string | undefined {
    const addressParts = [
      clinic.address_line_1,
      clinic.address_line_2,
      clinic.city,
      clinic.postcode
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : undefined;
  },

  formatClinicData(clinicData: RawClinicData) {
    return {
      id: clinicData.id,
      name: clinicData.clinic_name || 'Unknown Clinic',
      logo: clinicData.logo_url || undefined,
      email: clinicData.email || undefined,
      phone: clinicData.phone || undefined,
      address: this.formatAddress(clinicData),
      stripeStatus: clinicData.stripe_status || undefined
    };
  }
};
