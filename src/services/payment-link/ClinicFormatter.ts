
/**
 * Utility class for formatting clinic information
 */
export class ClinicFormatter {
  /**
   * Format clinic address for display
   */
  static formatAddress(clinicData: any): string {
    console.log('Formatting clinic address with:', JSON.stringify({
      address_line_1: clinicData?.address_line_1,
      address_line_2: clinicData?.address_line_2,
      city: clinicData?.city,
      postcode: clinicData?.postcode
    }));
    
    if (!clinicData) return '';
    
    const addressParts = [
      clinicData.address_line_1,
      clinicData.address_line_2,
      clinicData.city,
      clinicData.postcode
    ].filter(part => !!part);
    
    return addressParts.join(', ');
  }
}
