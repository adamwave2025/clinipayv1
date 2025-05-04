
import { toast } from 'sonner';

export interface ValidationProps {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  selectedLink: string;
  customAmount: string;
  startDate: Date;
}

export function useFormValidation() {
  const validateForm = (formData: ValidationProps) => {
    if (!formData.patientName || !formData.patientEmail) {
      toast.error('Please fill in all required fields');
      return false;
    }
    
    if (!formData.selectedLink && !formData.customAmount) {
      toast.error('Please either select a payment option or enter a custom amount');
      return false;
    }
    
    if (formData.customAmount && (isNaN(Number(formData.customAmount)) || Number(formData.customAmount) <= 0)) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.patientEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    if (formData.patientPhone) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.patientPhone)) {
        toast.error('Please enter a valid phone number');
        return false;
      }
    }
    
    return true;
  };

  return {
    validateForm
  };
}
