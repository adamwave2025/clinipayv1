
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SendLinkFormData } from './types';

export function usePatientOperations() {
  const [isProcessingPatient, setIsProcessingPatient] = useState(false);

  const findOrCreatePatient = async (
    formData: SendLinkFormData, 
    clinicId: string, 
    providedPatientId?: string
  ): Promise<string | null> => {
    if (providedPatientId) {
      console.log('⚠️ CRITICAL: Using provided patient ID:', providedPatientId);
      return providedPatientId;
    }

    setIsProcessingPatient(true);
    try {
      // Look for existing patient with this email
      if (formData.patientEmail) {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('email', formData.patientEmail)
          .maybeSingle();
            
        if (existingPatient) {
          console.log('⚠️ CRITICAL: Found existing patient:', existingPatient.id);
          return existingPatient.id;
        }
      }

      // Try to find by phone if email lookup failed or wasn't provided
      if (formData.patientPhone) {
        const { data: existingPatientByPhone } = await supabase
          .from('patients')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('phone', formData.patientPhone.replace(/\D/g, ''))
          .maybeSingle();
            
        if (existingPatientByPhone) {
          console.log('⚠️ CRITICAL: Found existing patient by phone:', existingPatientByPhone.id);
          return existingPatientByPhone.id;
        }
      }

      // Create a new patient if not found
      if (formData.patientName) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinicId,
            name: formData.patientName,
            email: formData.patientEmail || null,
            phone: formData.patientPhone ? formData.patientPhone.replace(/\D/g, '') : null
          })
          .select()
          .single();
              
        if (patientError) {
          console.error('⚠️ CRITICAL ERROR: Error creating patient:', patientError);
          return null;
        } else if (newPatient) {
          console.log('⚠️ CRITICAL: Created new patient:', newPatient.id);
          return newPatient.id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('⚠️ CRITICAL ERROR: Error in patient operations:', error);
      return null;
    } finally {
      setIsProcessingPatient(false);
    }
  };

  return {
    isProcessingPatient,
    findOrCreatePatient
  };
}
