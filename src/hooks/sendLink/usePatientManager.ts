
import { useState } from 'react';
import { Patient } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePatientManager() {
  const [creatingPatientInProgress, setCreatingPatientInProgress] = useState(false);

  // Create or get a patient record
  const createOrGetPatient = async (
    patientName: string,
    patientEmail: string,
    patientPhone: string,
    isCreatingNewPatient: boolean,
    selectedPatient: Patient | null
  ): Promise<string | null> => {
    // If we already have a patient with an ID, return it immediately
    if (selectedPatient?.id) {
      console.log('Using existing selected patient:', selectedPatient.id);
      return selectedPatient.id;
    }
    
    // Input validation - patient must have a name and email
    if (!patientName || !patientEmail) {
      toast.error('Patient name and email are required');
      return null;
    }
    
    // Prevent concurrent patient creation
    if (creatingPatientInProgress) {
      toast.error('Patient creation already in progress');
      return null;
    }
    
    setCreatingPatientInProgress(true);
    const patientLoadingToast = toast.loading('Creating patient record...');
    
    try {
      // Get the clinic ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError || !userData?.clinic_id) {
        toast.dismiss(patientLoadingToast);
        toast.error('Could not determine clinic ID');
        return null;
      }

      const clinicId = userData.clinic_id;
      console.log('Creating patient with clinic ID:', clinicId);
      
      // Check for existing patient with this email first
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('email', patientEmail)
        .maybeSingle();
      
      if (existingPatient) {
        console.log('Found existing patient with same email:', existingPatient.id);
        toast.dismiss(patientLoadingToast);
        toast.success('Found existing patient record');
        return existingPatient.id;
      }
      
      // Create the new patient
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          clinic_id: clinicId,
          name: patientName,
          email: patientEmail,
          phone: patientPhone || null
        })
        .select('*')
        .single();
      
      if (patientError || !newPatient) {
        console.error('Error creating patient:', patientError);
        toast.dismiss(patientLoadingToast);
        toast.error(`Could not create new patient: ${patientError?.message || 'Unknown error'}`);
        return null;
      }
      
      console.log('Successfully created new patient with ID:', newPatient.id);
      
      // Verify patient creation by fetching it again
      const { data: verifiedPatient, error: verifyError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', newPatient.id)
        .single();
          
      if (verifyError || !verifiedPatient) {
        console.error('Error verifying patient creation:', verifyError);
        toast.dismiss(patientLoadingToast);
        toast.error('Could not verify patient creation');
        return null;
      }
      
      toast.dismiss(patientLoadingToast);
      toast.success('Patient created successfully');
      return verifiedPatient.id;
    } catch (error: any) {
      console.error('Error in createOrGetPatient:', error);
      toast.dismiss(patientLoadingToast);
      toast.error(`Patient error: ${error.message}`);
      return null;
    } finally {
      setCreatingPatientInProgress(false);
    }
  };

  return {
    createOrGetPatient,
    creatingPatientInProgress
  };
}
