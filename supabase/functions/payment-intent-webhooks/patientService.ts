
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Service for handling patient-related operations
 */
export class PatientService {
  /**
   * Find a patient by email or phone, or create a new patient if not found
   * @param supabase Supabase client
   * @param patientName Patient name
   * @param patientEmail Patient email
   * @param patientPhone Patient phone
   * @param clinicId Clinic ID
   * @param patientId Optional patient ID if already known
   * @returns Patient ID or null if unable to find/create
   */
  static async findOrCreatePatient(
    supabase: SupabaseClient,
    patientName: string,
    patientEmail: string | undefined,
    patientPhone: string | undefined,
    clinicId: string,
    patientId?: string
  ): Promise<string | null> {
    // If patient ID is provided, use it directly
    if (patientId) {
      console.log(`Using provided patient ID: ${patientId}`);
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
          console.log(`Found existing patient by email: ${existingPatient.id}`);
          return existingPatient.id;
        }
      }

      // Try to find by phone if email lookup failed or wasn't provided
      if (patientPhone) {
        // Format phone by removing non-numeric characters for consistency
        const formattedPhone = patientPhone.replace(/\D/g, '');
        
        const { data: existingPatientByPhone } = await supabase
          .from('patients')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('phone', formattedPhone)
          .maybeSingle();
            
        if (existingPatientByPhone) {
          console.log(`Found existing patient by phone: ${existingPatientByPhone.id}`);
          return existingPatientByPhone.id;
        }
      }

      // Create a new patient if not found and name is provided
      if (patientName) {
        // Format phone by removing non-numeric characters for consistency
        const formattedPhone = patientPhone ? patientPhone.replace(/\D/g, '') : null;
        
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinicId,
            name: patientName,
            email: patientEmail || null,
            phone: formattedPhone
          })
          .select()
          .single();
              
        if (patientError) {
          console.error(`Error creating patient: ${patientError.message}`);
          return null;
        } else if (newPatient) {
          console.log(`Created new patient: ${newPatient.id}`);
          return newPatient.id;
        }
      } else {
        console.log('Cannot create patient without a name');
      }
      
      return null;
    } catch (error) {
      console.error(`Error in patient operations: ${error.message}`);
      return null;
    }
  }
}
