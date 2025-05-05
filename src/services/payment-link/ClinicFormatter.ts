
import { RawClinicData } from '@/types/paymentLink';

/**
 * Formatter for clinic data
 */
export const ClinicFormatter = {
  formatClinicData(clinicData: RawClinicData | null) {
    if (!clinicData) {
      console.warn('ClinicFormatter: No clinic data provided to format');
      return {
        id: 'unknown',
        name: 'Unknown Clinic',
        stripeStatus: 'not_connected'
      };
    }

    try {
      // Build the address string if components exist
      let addressParts = [];
      if (clinicData.address_line_1) addressParts.push(clinicData.address_line_1);
      if (clinicData.address_line_2) addressParts.push(clinicData.address_line_2);
      if (clinicData.city) addressParts.push(clinicData.city);
      if (clinicData.postcode) addressParts.push(clinicData.postcode);
      
      const address = addressParts.length > 0 ? addressParts.join(', ') : undefined;
      
      return {
        id: clinicData.id,
        name: clinicData.clinic_name || 'Unknown Clinic',
        logo: clinicData.logo_url,
        email: clinicData.email,
        phone: clinicData.phone,
        address: address,
        stripeStatus: clinicData.stripe_status || 'not_connected'
      };
    } catch (error) {
      console.error('ClinicFormatter: Error formatting clinic data:', error);
      return {
        id: clinicData.id || 'unknown',
        name: clinicData.clinic_name || 'Unknown Clinic',
        stripeStatus: clinicData.stripe_status || 'not_connected'
      };
    }
  },

  /**
   * Format clinic address from raw clinic data
   * @param clinicData Raw clinic data
   * @returns Formatted address string or empty string if no address components
   */
  formatAddress(clinicData: RawClinicData | null): string {
    if (!clinicData) {
      return '';
    }

    try {
      // Build the address string if components exist
      let addressParts = [];
      if (clinicData.address_line_1) addressParts.push(clinicData.address_line_1);
      if (clinicData.address_line_2) addressParts.push(clinicData.address_line_2);
      if (clinicData.city) addressParts.push(clinicData.city);
      if (clinicData.postcode) addressParts.push(clinicData.postcode);
      
      return addressParts.length > 0 ? addressParts.join(', ') : '';
    } catch (error) {
      console.error('ClinicFormatter: Error formatting clinic address:', error);
      return '';
    }
  }
};
