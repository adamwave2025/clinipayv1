
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Setup auth trigger function called");
    
    // Create Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if the auth trigger function exists and create it if not
    console.log("Verifying handle_new_user function and trigger");
    
    // We'll use a direct SQL query to check if the trigger exists
    const { data: triggerData, error: triggerError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
      SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
      ) AS trigger_exists;
      `
    });

    if (triggerError) {
      console.log("Error checking trigger existence, will proceed with creation:", triggerError);
    } else {
      console.log("Trigger check result:", triggerData);
    }

    // Create or update the auth trigger regardless of previous check result
    // This ensures we always have the latest version
    console.log("Creating/updating auth trigger...");
    
    const { error: updateError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
      -- Create function to handle new users
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      DECLARE
        clinic_id uuid;
        clinic_name text;
      BEGIN
        -- Extract clinic_name from user metadata for debugging
        clinic_name := NEW.raw_user_meta_data->>'clinic_name';
        
        -- Log the new user creation for debugging
        RAISE NOTICE 'New user created: id=%, email=%, clinic_name=%', NEW.id, NEW.email, clinic_name;
        
        -- If clinic_name is provided, try to find or create a clinic
        IF clinic_name IS NOT NULL THEN
          -- First check if a clinic already exists with this email to avoid duplicates
          SELECT id INTO clinic_id FROM public.clinics WHERE email = NEW.email LIMIT 1;
          
          IF clinic_id IS NULL THEN
            -- Create new clinic record
            INSERT INTO public.clinics (email, clinic_name)
            VALUES (NEW.email, clinic_name)
            RETURNING id INTO clinic_id;
            
            RAISE NOTICE 'Created new clinic with ID: % for email: % and name: %', clinic_id, NEW.email, clinic_name;
          ELSE
            RAISE NOTICE 'Found existing clinic with ID: % for email: %', clinic_id, NEW.email;
          END IF;
        ELSE
          RAISE NOTICE 'No clinic_name provided in user metadata, skipping clinic creation';
        END IF;
        
        -- Insert or update user record with clinic_id (if found)
        INSERT INTO public.users (id, email, role, verified, clinic_id)
        VALUES (NEW.id, NEW.email, 'clinic', false, clinic_id)
        ON CONFLICT (id) 
        DO UPDATE SET 
          clinic_id = EXCLUDED.clinic_id,
          email = EXCLUDED.email
        WHERE public.users.clinic_id IS NULL OR public.users.clinic_id = EXCLUDED.clinic_id;
        
        RAISE NOTICE 'Inserted/updated user record with clinic_id: %', clinic_id;
        
        RETURN NEW;
      END;
      $$;

      -- Create or replace the trigger
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    });
    
    if (updateError) {
      console.error("Error updating auth trigger:", updateError);
      throw new Error("Failed to update auth trigger: " + updateError.message);
    }
    
    console.log("Auth trigger updated successfully");
    
    // Set up webhook URL for auth user creation
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-new-signup`;
    
    // Store the webhook URL in system_settings table
    const { error: settingError } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        key: 'auth_webhook_url',
        value: webhookUrl
      }, { onConflict: 'key' });
    
    if (settingError) {
      console.log("Could not store webhook URL in settings:", settingError.message);
    } else {
      console.log("Successfully stored webhook URL in system_settings:", webhookUrl);
    }
    
    // Return success
    return new Response(
      JSON.stringify({ 
        message: "Auth settings updated successfully",
        webhookUrl: webhookUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error updating auth settings:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Please check the Edge Function logs for more details"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
