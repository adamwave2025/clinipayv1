
import { PaymentLink } from '@/types/payment';
import { PaymentLinkData } from '@/types/paymentLink';
import { PaymentLinkDataService } from './payment-link/PaymentLinkDataService';
import { PaymentLinkFormatter } from './payment-link/PaymentLinkFormatter';
import { ClinicFormatter } from './payment-link/ClinicFormatter';

export const PaymentLinkService = {
  // Core data access methods
  async fetchLinks(userId: string) {
    try {
      // Get the clinic_id for the current user
      const clinicId = await PaymentLinkDataService.fetchUserClinicId(userId);

      // Fetch active payment links for this clinic
      const activeLinks = await PaymentLinkDataService.fetchActiveLinks(clinicId);

      // Fetch archived payment links for this clinic
      const archivedLinks = await PaymentLinkDataService.fetchArchivedLinks(clinicId);

      return { 
        activeLinks,
        archivedLinks,
        clinicId
      };
    } catch (error: any) {
      console.error('Error fetching payment links:', error);
      throw error;
    }
  },

  async toggleArchiveStatus(linkId: string, archive: boolean) {
    try {
      const result = await PaymentLinkDataService.toggleLinkArchiveStatus(linkId, !archive);
      return result;
    } catch (error: any) {
      console.error(`Error ${archive ? 'archiving' : 'unarchiving'} payment link:`, error);
      return { success: false, error: error.message };
    }
  },

  async createPaymentLink(linkData: Partial<PaymentLink>, clinicId: string) {
    try {
      console.log('PaymentLinkService: Creating payment link with data:', linkData);
      
      // Ensure all required fields are present for payment plans
      if (linkData.paymentPlan) {
        if (!linkData.paymentCount || !linkData.paymentCycle) {
          throw new Error('Payment plan requires payment count and cycle');
        }
        
        if (!linkData.planTotalAmount && linkData.amount && linkData.paymentCount) {
          linkData.planTotalAmount = linkData.amount * linkData.paymentCount;
        }
      }
      
      // Create the payment link in the database
      const data = await PaymentLinkDataService.createLink(linkData, clinicId);
      console.log('PaymentLinkService: Link created successfully:', data);
      
      return { 
        success: true, 
        data
      };
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      return { success: false, error: error.message };
    }
  },

  async fetchPaymentRequest(requestId: string): Promise<PaymentLinkData | null> {
    try {
      // Fetch payment request with clinic data
      const data = await PaymentLinkDataService.fetchPaymentRequestWithClinic(requestId);
      return PaymentLinkFormatter.formatPaymentRequest(data);
    } catch (error) {
      console.error('Error fetching payment request:', error);
      return null;
    }
  },

  async fetchPaymentLink(linkId: string): Promise<PaymentLinkData | null> {
    try {
      // Fetch payment link with clinic data
      const data = await PaymentLinkDataService.fetchPaymentLinkWithClinic(linkId);
      return PaymentLinkFormatter.formatPaymentLink(data);
    } catch (error) {
      console.error('Error fetching payment link:', error);
      return null;
    }
  }
};
