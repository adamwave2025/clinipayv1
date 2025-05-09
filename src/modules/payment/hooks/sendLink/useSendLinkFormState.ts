
import { useState } from 'react';

export interface SendLinkFormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  selectedLink: string;
  customAmount: string;
  message: string;
  scheduledDate?: Date | null;
}

export function useSendLinkFormState() {
  const [formData, setFormData] = useState<SendLinkFormData>({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    selectedLink: '',
    customAmount: '',
    message: ''
  });
  
  const updateFormData = (field: keyof SendLinkFormData, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };
  
  const resetFormData = () => {
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      selectedLink: '',
      customAmount: '',
      message: ''
    });
  };

  return {
    formData,
    updateFormData,
    resetFormData
  };
}
