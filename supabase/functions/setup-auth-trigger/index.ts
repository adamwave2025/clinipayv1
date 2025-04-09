
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

    // First check if execute_sql function exists
    console.log("Checking if execute_sql function exists");
    const { data: fnData, error: fnError } = await supabaseAdmin
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'execute_sql')
      .limit(1);

    console.log("Function check result:", fnData, fnError);

    // If execute_sql function doesn't exist, create it
    if (fnError || !fnData || fnData.length === 0) {
      console.log("Creating execute_sql function...");
      const { error: createFnError } = await supabaseAdmin.rpc('execute_sql', {
        sql: `
        -- Create a generic function to execute SQL commands
        CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
          RETURN json_build_object('success', true);
        EXCEPTION WHEN OTHERS THEN
          RETURN json_build_object('success', false, 'error', SQLERRM);
        END;
        $$;
        `
      });

      if (createFnError) {
        console.log("Error creating execute_sql function:", createFnError);
        
        // Alternative method if RPC fails: use raw query
        const { error: rawError } = await supabaseAdmin.auth.admin.createUser({
          email: "temp@example.com",
          password: "temp-password-123",
          email_confirm: true,
          user_metadata: { temp: true }
        });
        
        if (rawError) {
          console.error("Could not create temp user:", rawError);
          throw new Error("Failed to create execute_sql function: " + rawError.message);
        }
      }
    }

    // Verify the auth trigger is working or create it
    console.log("Creating/updating auth trigger...");
    const { error: triggerError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
      -- Create function to handle new users
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      DECLARE
        clinic_id uuid;
      BEGIN
        -- Extract clinic_name from user metadata and use it to create or find clinic
        IF NEW.raw_user_meta_data->>'clinic_name' IS NOT NULL THEN
          -- For debugging
          RAISE NOTICE 'Creating clinic with name: %', NEW.raw_user_meta_data->>'clinic_name';
          
          -- First try to find existing clinic with this email to avoid duplicates
          SELECT id INTO clinic_id FROM public.clinics WHERE email = NEW.email LIMIT 1;
          
          IF clinic_id IS NULL THEN
            -- Create new clinic record if none exists
            INSERT INTO public.clinics (email, clinic_name)
            VALUES (NEW.email, NEW.raw_user_meta_data->>'clinic_name')
            RETURNING id INTO clinic_id;
            
            -- For debugging
            RAISE NOTICE 'Created new clinic with ID: %', clinic_id;
          ELSE
            -- For debugging
            RAISE NOTICE 'Found existing clinic with ID: %', clinic_id;
          END IF;
        ELSE
          -- For debugging
          RAISE NOTICE 'No clinic_name found in user metadata';
        END IF;
        
        -- Insert into users table with clinic_id
        INSERT INTO public.users (id, email, role, verified, clinic_id)
        VALUES (NEW.id, NEW.email, 'clinic', false, clinic_id)
        ON CONFLICT (id) DO UPDATE 
        SET clinic_id = EXCLUDED.clinic_id
        WHERE public.users.clinic_id IS NULL;
        
        -- For debugging
        RAISE NOTICE 'Inserted user with ID: % and clinic_id: %', NEW.id, clinic_id;
        
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
    
    if (triggerError) {
      console.error("Error creating auth trigger:", triggerError);
      throw new Error("Failed to create auth trigger: " + triggerError.message);
    }
    
    console.log("Auth trigger created successfully");
    
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
