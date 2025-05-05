
import { useState } from 'react';
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';

export interface LinkFormData {
  paymentTitle: string;
  amount: string;
  paymentType: string;
  description: string;
  paymentPlan: boolean;
  paymentCount: string;
  paymentCycle: string;
}

interface UseCreateLinkFormProps {
  onLinkGenerated: (link: string, formData: LinkFormData) => void;
  onCreateLink?: (data: Omit<PaymentLink, 'id' | 'url' | 'createdAt' | 'isActive'>) => Promise<{ success: boolean, paymentLink?: PaymentLink, error?: string }>;
  onSubmit?: (formData: LinkFormData) => void;
  isLoading: boolean;
  defaultPaymentType?: string;
}

// Helper function to transform LinkFormData to PaymentLink format
// Converts display amounts (e.g., 100.50) to cents (10050) for database storage
const transformFormDataToPaymentLink = (formData: LinkFormData): Omit<PaymentLink, 'id' | 'url' | 'createdAt' | 'isActive'> => {
  // Parse amount as float and multiply by 100 to convert to cents
  const amountInCents = Math.round(parseFloat(formData.amount) * 100);
  
  // Calculate plan total amount in cents if it's a payment plan
  const planTotalAmountInCents = formData.paymentPlan 
    ? amountInCents * Number(formData.paymentCount) 
    : undefined;
  
  return {
    title: formData.paymentTitle,
    amount: amountInCents,
    type: formData.paymentType,
    description: formData.description,
    paymentPlan: formData.paymentPlan,
    paymentCount: formData.paymentPlan ? Number(formData.paymentCount) : undefined,
    paymentCycle: formData.paymentPlan ? formData.paymentCycle : undefined,
    planTotalAmount: planTotalAmountInCents
  };
};

export function useCreateLinkForm({ 
  onLinkGenerated, 
  onCreateLink, 
  onSubmit, 
  isLoading,
  defaultPaymentType = 'payment_plan'
}: UseCreateLinkFormProps) {
  const isPlan = defaultPaymentType === 'payment_plan';
  
  const [formData, setFormData] = useState<LinkFormData>({
    paymentTitle: '',
    amount: '',
    paymentType: defaultPaymentType,
    description: '',
    paymentPlan: isPlan,
    paymentCount: '',
    paymentCycle: 'monthly',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If payment type changes to "payment_plan", set paymentPlan to true
    if (name === 'paymentType' && value === 'payment_plan') {
      setFormData(prev => ({ ...prev, paymentPlan: true }));
    } else if (name === 'paymentType' && value !== 'payment_plan') {
      setFormData(prev => ({ ...prev, paymentPlan: false }));
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.paymentTitle || !formData.amount) {
      toast.error('Please fill in all required fields');
      return false;
    }
    
    // Validate amount as a valid decimal number
    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    // Additional validation for payment plan
    if (formData.paymentPlan) {
      if (!formData.paymentCount || isNaN(Number(formData.paymentCount)) || Number(formData.paymentCount) < 2) {
        toast.error('Please enter a valid number of payments (minimum 2)');
        return false;
      }

      if (!formData.paymentCycle) {
        toast.error('Please select a payment cycle');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // If this is a payment plan and we have an onSubmit handler, use that instead
    // to trigger the confirmation dialog
    if (formData.paymentPlan && onSubmit) {
      onSubmit(formData);
      return;
    }
    
    if (onCreateLink) {
      // Use Supabase to create the link
      try {
        // Transform the form data to the expected PaymentLink format
        // This now handles converting display amounts to cents
        const paymentData = transformFormDataToPaymentLink(formData);
        
        console.log('Creating payment link with data:', paymentData);
        const result = await onCreateLink(paymentData);
        console.log('Payment link creation result:', result);
        
        if (result.success && result.paymentLink) {
          onLinkGenerated(result.paymentLink.url, formData);
        } else {
          toast.error(result.error || 'Failed to create payment link');
        }
      } catch (error: any) {
        console.error('Error creating payment link:', error);
        toast.error('An error occurred while creating the payment link');
      }
    } else {
      // Fallback to mock link generation for development
      setTimeout(() => {
        const uniqueId = Math.random().toString(36).substring(2, 10);
        const mockLink = `https://clinipay.com/pay/${uniqueId}`;
        onLinkGenerated(mockLink, formData);
      }, 1500);
    }
  };

  return {
    formData,
    handleChange,
    handleSelectChange,
    handleSubmit
  };
}
