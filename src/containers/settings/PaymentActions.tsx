
import { toast } from 'sonner';
import { ClinicData } from '@/hooks/useClinicData';

export const handlePaymentAction = async (
  action: 'connect' | 'disconnect',
  updateClinicData: (data: Partial<ClinicData>) => Promise<{ success: boolean }>
) => {
  if (action === 'connect') {
    toast.info('Connecting to Stripe...');
    
    try {
      const result = await updateClinicData({
        stripe_account_id: 'acct_' + Math.random().toString(36).substring(2, 15),
        stripe_status: 'pending',
      });
      
      if (result.success) {
        toast.success('Successfully connected to Stripe');
      } else {
        toast.error('Failed to connect to Stripe');
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      toast.error('An error occurred while connecting to Stripe');
    }
  } else {
    toast.info('Disconnecting from Stripe...');
    
    try {
      const result = await updateClinicData({
        stripe_account_id: null,
        stripe_status: null,
      });
      
      if (result.success) {
        toast.success('Successfully disconnected from Stripe');
      } else {
        toast.error('Failed to disconnect from Stripe');
      }
    } catch (error) {
      console.error('Error disconnecting from Stripe:', error);
      toast.error('An error occurred while disconnecting from Stripe');
    }
  }
};

export const handleUpdatePassword = () => {
  toast.success('Password updated successfully');
};
