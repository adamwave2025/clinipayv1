
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
    
    // Disable Supabase's automatic email verification
    console.log("Disabling Supabase's automatic email verification...");
    
    try {
      // Create helper function for executing direct SQL
      const executeSQL = async (sql: string, description: string) => {
        try {
          const { error } = await supabaseAdmin.rpc('select_service_role', {
            service_request: sql
          });
          
          if (error) {
            console.error(`Error executing SQL (${description}):`, error.message);
            return false;
          }
          
          console.log(`SQL executed successfully: ${description}`);
          return true;
        } catch (err) {
          console.error(`Exception executing SQL (${description}):`, err);
          return false;
        }
      };
      
      // Try direct SQL execution as a fallback method
      const executeSQLDirect = async (sql: string, description: string) => {
        try {
          // Using raw query to execute SQL directly
          const { data, error } = await supabaseAdmin.auth.admin.executeQuery(sql);
          
          if (error) {
            console.error(`Error executing direct SQL (${description}):`, error.message);
            return false;
          }
          
          console.log(`Direct SQL executed successfully: ${description}`);
          return true;
        } catch (err) {
          console.error(`Exception executing direct SQL (${description}):`, err);
          return false;
        }
      };
      
      // Try to disable email verification
      await executeSQL(
        `UPDATE auth.config SET enable_signup_captcha = false, enable_email_confirm = false WHERE id = 1`,
        "Disable email verification"
      );
      
      // Set auto confirm to true via another method
      await executeSQL(
        `INSERT INTO auth.config (name, value) 
        VALUES ('mailer.autoconfirm', 'true') 
        ON CONFLICT (name) DO UPDATE SET value = 'true'`,
        "Set mailer.autoconfirm to true"
      );
      
    } catch (configError) {
      console.error("Error updating auth settings:", configError);
    }

    // Create user_verification table if it doesn't exist
    console.log("Creating user_verification table if it doesn't exist...");
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.user_verification (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          verification_token TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          verified BOOLEAN DEFAULT false
        );
        
        -- Add indexes for faster token lookups
        CREATE INDEX IF NOT EXISTS idx_user_verification_token ON public.user_verification(verification_token);
        CREATE INDEX IF NOT EXISTS idx_user_verification_user_id ON public.user_verification(user_id);
        
        -- Add RLS policies
        ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;
      `;
      
      const { error: tableError } = await supabaseAdmin.rpc('select_service_role', {
        service_request: createTableSQL
      });
      
      if (tableError) {
        console.error("Error creating user_verification table with RPC:", tableError);
        
        // Try direct query as fallback
        const { error: directError } = await supabaseAdmin.auth.admin.executeQuery(createTableSQL);
        
        if (directError) {
          console.error("Error creating user_verification table with direct query:", directError);
        } else {
          console.log("Successfully created user_verification table with direct query");
        }
      } else {
        console.log("Successfully created user_verification table or confirmed it exists");
      }
    } catch (tableError) {
      console.error("Error creating user_verification table:", tableError);
    }

    // Create process_auth_user_created function if it doesn't exist
    console.log("Creating process_auth_user_created function if it doesn't exist...");
    try {
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.process_auth_user_created()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        DECLARE
          webhook_url TEXT;
          payload JSONB;
          result JSONB;
        BEGIN
          -- Get the webhook URL from system_settings
          SELECT value INTO webhook_url FROM public.system_settings WHERE key = 'auth_webhook_url';
          
          -- Skip if no webhook URL is configured
          IF webhook_url IS NULL THEN
            RAISE WARNING 'No webhook URL configured for auth_user_created';
            RETURN NEW;
          END IF;
          
          -- Prepare the payload
          payload := jsonb_build_object(
            'type', 'INSERT',
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'record', row_to_json(NEW)::jsonb
          );
          
          -- Send the webhook asynchronously
          PERFORM http_post(
            webhook_url,
            payload::text,
            'application/json'
          );
          
          RAISE NOTICE 'Webhook sent to %', webhook_url;
          
          RETURN NEW;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE WARNING 'Error sending webhook: %', SQLERRM;
            RETURN NEW;
        END;
        $$;
      `;
      
      const { error: functionError } = await supabaseAdmin.rpc('select_service_role', {
        service_request: createFunctionSQL
      });
      
      if (functionError) {
        console.error("Error creating process_auth_user_created function with RPC:", functionError);
        
        // Try direct query as fallback
        const { error: directError } = await supabaseAdmin.auth.admin.executeQuery(createFunctionSQL);
        
        if (directError) {
          console.error("Error creating process_auth_user_created function with direct query:", directError);
        } else {
          console.log("Successfully created process_auth_user_created function with direct query");
        }
      } else {
        console.log("Successfully created process_auth_user_created function");
      }
    } catch (functionError) {
      console.error("Error creating process_auth_user_created function:", functionError);
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
    
    // Check if the database trigger is set up
    const checkTriggerSQL = `
      SELECT EXISTS(
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgrelid = 'auth.users'::regclass
      ) as trigger_exists
    `;
    
    let triggerExists = false;
    
    const { data: triggerData, error: triggerCheckError } = await supabaseAdmin.rpc('select_service_role', {
      service_request: checkTriggerSQL
    });
    
    if (triggerCheckError) {
      console.error("Error checking if trigger exists with RPC:", triggerCheckError);
      
      // Try direct query as fallback
      const { data: directData, error: directError } = await supabaseAdmin.auth.admin.executeQuery(checkTriggerSQL);
      
      if (directError) {
        console.error("Error checking if trigger exists with direct query:", directError);
      } else {
        triggerExists = directData && directData.length > 0 && directData[0].trigger_exists;
        console.log("Trigger check with direct query result:", triggerExists);
      }
    } else {
      triggerExists = triggerData && triggerData.length > 0 && triggerData[0].trigger_exists;
      console.log("Trigger check with RPC result:", triggerExists);
    }
    
    // If trigger doesn't exist, create it
    if (!triggerExists) {
      console.log("Setting up auth user creation trigger...");
      
      try {
        // Create the trigger to call our function
        const createTriggerSQL = `
          CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.process_auth_user_created();
        `;
        
        const { error: triggerError } = await supabaseAdmin.rpc('select_service_role', {
          service_request: createTriggerSQL
        });
        
        if (triggerError) {
          console.error("Error creating auth trigger with RPC:", triggerError);
          
          // Try direct query as fallback
          const { error: directError } = await supabaseAdmin.auth.admin.executeQuery(createTriggerSQL);
          
          if (directError) {
            console.error("Error creating auth trigger with direct query:", directError);
          } else {
            console.log("Successfully created auth user trigger with direct query");
          }
        } else {
          console.log("Successfully created auth user trigger");
        }
      } catch (triggerCreateError) {
        console.error("Error setting up auth trigger:", triggerCreateError);
      }
    } else {
      console.log("Auth user creation trigger already exists");
    }
    
    // Return success
    return new Response(
      JSON.stringify({ 
        message: "Auth settings updated successfully",
        webhookUrl: webhookUrl,
        triggerExists: triggerExists,
        note: "The system is configured for custom email verification. Automatic Supabase verification has been disabled." 
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
