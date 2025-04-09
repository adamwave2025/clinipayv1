
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

    // First, let's create the execute_sql function if it doesn't exist
    // This will allow us to run SQL commands from edge functions
    const { error: sqlFunctionError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .limit(1);
    
    if (sqlFunctionError) {
      console.error("Error connecting to database:", sqlFunctionError);
      
      // Try creating the execute_sql function via raw query
      try {
        // Direct SQL query to create the function using fetch
        const sqlEndpoint = `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/execute_sql`;
        
        const createFunctionResponse = await fetch(sqlEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          },
          body: JSON.stringify({
            sql: `
            CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
            RETURNS json
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = 'public'
            AS $$
            DECLARE
              result json;
            BEGIN
              EXECUTE sql;
              RETURN json_build_object('success', true);
            EXCEPTION WHEN OTHERS THEN
              RETURN json_build_object('success', false, 'error', SQLERRM);
            END;
            $$;
            `
          })
        });
        
        if (!createFunctionResponse.ok) {
          const errorData = await createFunctionResponse.json();
          console.error("Failed to create execute_sql function:", errorData);
        } else {
          console.log("Successfully created execute_sql function via direct query");
        }
      } catch (directError) {
        console.error("Failed to create execute_sql function via direct query:", directError);
      }
    }

    // Check if the auth trigger function exists and create it if not
    console.log("Verifying handle_new_user function and trigger");
    
    // Create or update the auth trigger regardless of previous check result
    // This ensures we always have the latest version
    console.log("Creating/updating auth trigger...");
    
    // Use direct SQL query instead of RPC to create trigger
    try {
      const sqlEndpoint = `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/execute_sql`;
      
      const updateResponse = await fetch(sqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        },
        body: JSON.stringify({
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
                
                -- Create default notification preferences for the new clinic
                -- Email notifications
                INSERT INTO public.notification_preferences (clinic_id, channel, type, enabled)
                VALUES
                  (clinic_id, 'email', 'payment_received', TRUE),
                  (clinic_id, 'email', 'refund_processed', TRUE),
                  (clinic_id, 'email', 'weekly_summary', TRUE),
                  (clinic_id, 'sms', 'payment_received', TRUE),
                  (clinic_id, 'sms', 'refund_processed', TRUE);
                  
                RAISE NOTICE 'Created default notification preferences for clinic ID: %', clinic_id;
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
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error("Error updating auth trigger via direct query:", errorData);
        throw new Error(`Failed to update auth trigger: ${JSON.stringify(errorData)}`);
      } else {
        console.log("Auth trigger updated successfully via direct query");
      }
    } catch (updateError) {
      console.error("Error updating auth trigger:", updateError);
      throw new Error("Failed to update auth trigger: " + updateError.message);
    }
    
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
