

import { toast } from 'sonner';
import { PaymentLink } from '../types/payment';
import { PaymentLinkService } from './PaymentLinkService';
import { formatPaymentLinks } from '../utils/paymentLinkFormatter';
import { getUserClinicId } from '@/utils/userUtils';

export const PaymentPlanService = {
  async fetchPaymentPlans(clinicId: string, showArchived: boolean = false, isTemplateView: boolean = false) {
    try {
      // Get fresh data directly from the service
      console.log(`PaymentPlanService: Fetching ${showArchived ? 'archived' : 'active'} ${isTemplateView ? 'plan templates' : 'patient plans'} for clinic ${clinicId}`);
      
      const { activeLinks, archivedLinks } = await PaymentLinkService.fetchLinks(clinicId);
      
      // Use archived links if showArchived is true, otherwise use active links
      const linksToUse = showArchived ? archivedLinks : activeLinks;
      
      // Filter and format the links to only get payment plans
      const plans = formatPaymentLinks(linksToUse).filter(link => {
        console.log(`Link ${link.id}: payment_plan=${link.paymentPlan}, title=${link.title}`);
        return link.paymentPlan === true;
      });
      
      console.log(`Fetched ${plans.length} ${showArchived ? 'archived' : 'active'} payment plans (templates: ${isTemplateView})`);
      
      return { plans, error: null };
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      return { plans: [], error };
    }
  },

  async archivePlan(planToArchive: PaymentLink) {
    try {
      console.log('Archiving plan:', planToArchive);
      
      // Call the PaymentLinkService to archive the payment link
      const result = await PaymentLinkService.archiveLink(planToArchive.id);
      
      if (result.success) {
        toast.success(`Payment plan "${planToArchive.title}" archived successfully`);
        return { success: true, error: null };
      } else {
        throw new Error(result.error || 'Unknown error occurred while archiving plan');
      }
    } catch (error) {
      console.error('Error archiving payment plan:', error);
      toast.error('Failed to archive payment plan');
      return { success: false, error };
    }
  },
  
  async unarchivePlan(planToUnarchive: PaymentLink) {
    try {
      console.log('Unarchiving plan:', planToUnarchive);
      
      // Call the PaymentLinkService to unarchive the payment link
      const result = await PaymentLinkService.unarchiveLink(planToUnarchive.id);
      
      if (result.success) {
        toast.success(`Payment plan "${planToUnarchive.title}" restored successfully`);
        return { success: true, error: null };
      } else {
        throw new Error(result.error || 'Unknown error occurred while unarchiving plan');
      }
    } catch (error) {
      console.error('Error unarchiving payment plan:', error);
      toast.error('Failed to unarchive payment plan');
      return { success: false, error };
    }
  }
};
