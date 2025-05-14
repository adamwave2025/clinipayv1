
import { supabase } from '@/integrations/supabase/client';

export const PatientService = {
  /**
   * Find a patient by email or phone, or create a new patient if not found
   */
  async findOrCreatePatient(
    patientName: string,
    patientEmail: string | undefined,
    patientPhone: string | undefined,
    clinicId: string,
    patientId?: string
  ): Promise<string | null> {
    // If patient ID is provided, use it directly
    if (patientId) {
      console.log('⚠️ CRITICAL: Using provided patient ID:', patientId);
      return patientId;
    }

    try {
      // Look for existing patient with this email
      if (patientEmail) {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('email', patientEmail)
          .maybeSingle();
            
        if (existingPatient) {
          console.log('⚠️ CRITICAL: Found existing patient by email:', existingPatient.id);
          return existingPatient.id;
        }
      }

      // Try to find by phone if email lookup failed or wasn't provided
      if (patientPhone) {
        const { data: existingPatientByPhone } = await supabase
          .from('patients')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('phone', patientPhone.replace(/\D/g, ''))
          .maybeSingle();
            
        if (existingPatientByPhone) {
          console.log('⚠️ CRITICAL: Found existing patient by phone:', existingPatientByPhone.id);
          return existingPatientByPhone.id;
        }
      }

      // Create a new patient if not found
      if (patientName) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinicId,
            name: patientName,
            email: patientEmail || null,
            phone: patientPhone ? patientPhone.replace(/\D/g, '') : null
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
    }
  }
};
