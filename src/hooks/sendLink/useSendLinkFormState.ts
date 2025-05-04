import { useState } from 'react';
import { Patient } from '@/hooks/usePatients';
import { addDays } from 'date-fns';

export interface SendLinkFormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  selectedLink: string;
  customAmount: string;
  message: string;
  startDate: Date;
}

export function useSendLinkFormState() {
  const [formData, setFormData] = useState<SendLinkFormData>({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    selectedLink: '',
    customAmount: '',
    message: '',
    startDate: new Date(),
  });
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreatingNewPatient, setIsCreatingNewPatient] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Handlers for form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, selectedLink: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, startDate: date }));
    }
  };

  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    setIsCreatingNewPatient(false);
    
    if (!patient) {
      // Keep the existing name if we're creating a new patient
      setFormData(prev => ({
        ...prev,
        patientEmail: '',
        patientPhone: '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        patientName: patient.name,
        patientEmail: patient.email || '',
        patientPhone: patient.phone || ''
      }));
    }
  };

  const handleCreateNew = (searchTerm: string) => {
    setSelectedPatient(null);
    setIsCreatingNewPatient(true);
    // Update the form with the search term as the patient name
    setFormData(prev => ({
      ...prev,
      patientName: searchTerm,
      patientEmail: '',
      patientPhone: '',
    }));
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      selectedLink: '',
      customAmount: '',
      message: '',
      startDate: new Date(),
    });
    setSelectedPatient(null);
    setIsCreatingNewPatient(false);
  };

  return {
    formData,
    setFormData,
    selectedPatient,
    setSelectedPatient,
    isCreatingNewPatient,
    setIsCreatingNewPatient,
    showConfirmation,
    setShowConfirmation,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handlePatientSelect,
    handleCreateNew,
    resetForm
  };
}
