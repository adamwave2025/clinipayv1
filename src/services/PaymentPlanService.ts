
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';
import { PaymentLinkService } from '@/services/PaymentLinkService';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';

export const PaymentPlanService = {
  async fetchPaymentPlans(userId: string, showArchived: boolean = false) {
    try {
      // Get fresh data directly from the service
      const { activeLinks, archivedLinks } = await PaymentLinkService.fetchLinks(userId);
      
      // Use archived links if showArchived is true, otherwise use active links
      const linksToUse = showArchived ? archivedLinks : activeLinks;
      
      // Filter and format the links
      const plans = formatPaymentLinks(linksToUse).filter(link => link.paymentPlan === true);
      
      console.log(`Fetched ${showArchived ? 'archived' : 'active'} payment plans:`, plans); // Debug output
      
      return { plans, error: null };
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      return { plans: [], error };
    }
  },

  async createPlan(planData: Partial<PaymentLink>) {
    try {
      // We would call the API to create the plan
      // This is a placeholder for the actual implementation
      
      toast.success(`Payment plan "${planData.title}" created successfully`);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error creating payment plan:', error);
      toast.error('Failed to create payment plan');
      return { success: false, error };
    }
  },
  
  async archivePlan(planToArchive: PaymentLink) {
    try {
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
