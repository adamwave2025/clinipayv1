
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/hooks/usePatients';
import ConfirmSaveDialog from './ConfirmSaveDialog';

interface EditPatientDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditPatientDialog: React.FC<EditPatientDialogProps> = ({
  patient,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [originalData, setOriginalData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: ''
  });

  // Load patient data when dialog opens
  useEffect(() => {
    if (open && patient) {
      const patientData = {
        name: patient.name || '',
        email: patient.email || '',
        phone: patient.phone || ''
      };
      setFormData(patientData);
      setOriginalData(patientData);
    }
  }, [open, patient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: ''
    };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }
    
    if (formData.email.trim()) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    setErrors(newErrors);
    return !newErrors.name && !newErrors.email;
  };

  const getChangedFields = () => {
    const changedFields: Record<string, { from: string; to: string }> = {};
    
    if (formData.name !== originalData.name) {
      changedFields.name = { from: originalData.name, to: formData.name };
    }
    
    if (formData.email !== originalData.email) {
      changedFields.email = { from: originalData.email || 'None', to: formData.email || 'None' };
    }
    
    if (formData.phone !== originalData.phone) {
      changedFields.phone = { from: originalData.phone || 'None', to: formData.phone || 'None' };
    }
    
    return changedFields;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Check if any fields actually changed
    const changedFields = getChangedFields();
    if (Object.keys(changedFields).length === 0) {
      toast.info('No changes to save');
      onOpenChange(false);
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleSaveConfirmed = async () => {
    setIsSubmitting(true);
    
    try {
      // Get only the fields that changed
      const updateData: { name?: string; email?: string; phone?: string } = {};
      
      if (formData.name !== originalData.name) {
        updateData.name = formData.name;
      }
      
      if (formData.email !== originalData.email) {
        updateData.email = formData.email || null;
      }
      
      if (formData.phone !== originalData.phone) {
        updateData.phone = formData.phone || null;
      }
      
      // Update the patient record
      const { data, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patient.id)
        .eq('clinic_id', patient.clinic_id)
        .select();
      
      if (error) {
        console.error('Error updating patient:', error);
        toast.error(`Could not update patient: ${error.message}`);
        return;
      }
      
      toast.success('Patient updated successfully');
      onSuccess();
      onOpenChange(false);
      setShowConfirmation(false);
    } catch (error: any) {
      console.error('Error in updatePatient:', error);
      toast.error(`Patient update error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update the patient's information.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Patient Name*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                disabled={isSubmitting}
                className="w-full"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Patient Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="patient@example.com"
                disabled={isSubmitting}
                className="w-full"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Patient Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="+44 7700 900000"
                disabled={isSubmitting}
                className="w-full"
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={isSubmitting ? 'opacity-70' : ''}
              >
                {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmSaveDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        changedFields={getChangedFields()}
        onConfirm={handleSaveConfirmed}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default EditPatientDialog;
