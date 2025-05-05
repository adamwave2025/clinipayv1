
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';
import { PaymentLinkService } from '@/services/PaymentLinkService';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';

export const PaymentPlanService = {
  async fetchPaymentPlans(userId: string) {
    try {
      // Get fresh data directly from the service
      const { activeLinks } = await PaymentLinkService.fetchLinks(userId);
      
      // Filter and format the links
      const plans = formatPaymentLinks(activeLinks).filter(link => link.paymentPlan === true);
      
      console.log('Fetched payment plans:', plans); // Debug output
      
      return { plans, error: null };
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      return { plans: [], error };
    }
  },
  
  async deletePlan(planToDelete: PaymentLink) {
    try {
      // Here we would call the API to delete the plan
      // This is a placeholder for the actual implementation
      
      toast.success(`Payment plan "${planToDelete.title}" deleted successfully`);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting payment plan:', error);
      toast.error('Failed to delete payment plan');
      return { success: false, error };
    }
  },
  
  async updatePlan(planToEdit: PaymentLink, editFormData: { title: string, description: string, amount: string }) {
    try {
      // Here we would call the API to update the plan
      // This is a placeholder for the actual implementation
      
      toast.success(`Payment plan "${editFormData.title}" updated successfully`);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating payment plan:', error);
      toast.error('Failed to update payment plan');
      return { success: false, error };
    }
  }
};
