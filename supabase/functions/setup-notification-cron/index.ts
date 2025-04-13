
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// This function will set up a cron job to process notifications every minute
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔧 Starting setup of notification processing cron job");

    // First, let's make sure we have the PATIENT_NOTIFICATION and CLINIC_NOTIFICATION secrets
    const patientNotifySecret = Deno.env.get("PATIENT_NOTIFICATION");
    const clinicNotifySecret = Deno.env.get("CLINIC_NOTIFICATION");
    
    if (!patientNotifySecret || !clinicNotifySecret) {
      console.warn("⚠️ Notification webhook secrets are not configured. Setting up default values.");
      
      // Get the system settings webhook URLs
      const { data: webhookData, error: webhookError } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', ['patient_notification_webhook', 'clinic_notification_webhook']);
      
      if (webhookError || !webhookData || webhookData.length < 2) {
        console.error("❌ Error fetching webhook URLs from system_settings:", webhookError);
        console.log("🔄 Will proceed with default webhook URLs");
      } else {
        console.log("✅ Found webhook URLs in system_settings:", webhookData);
        
        // TODO: In a production environment, we would save these to the secrets
        // This is just for demonstration purposes
        console.log("Note: In production, these would be saved to edge function secrets");
      }
    } else {
      console.log("✅ Notification webhook secrets are configured");
    }

    // Check if execute_sql function exists before trying to use it
    try {
      // Test the execute_sql function
      const testResult = await supabase.rpc('execute_sql', { 
        sql: 'SELECT NOW()' 
      });
      
      if (testResult.error) {
        throw new Error(`Execute SQL function test failed: ${testResult.error.message}`);
      }
      
      console.log("✅ Execute SQL function test successful");
    } catch (testError) {
      console.error("❌ Execute SQL function test failed:", testError);
      
      // Create the execute_sql function if it doesn't exist
      console.log("🔄 Attempting to create execute_sql function...");
      
      try {
        const createSql = `
          -- Create a function that can execute SQL statements
          CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = public
          AS $$
          DECLARE
            result JSONB;
          BEGIN
            EXECUTE sql INTO result;
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object(
              'error', SQLERRM,
              'detail', SQLSTATE,
              'sql', sql
            );
          END;
          $$;
          
          -- Grant execute permission to authenticated users
          GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
          -- Grant execute permission to service_role
          GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;
        `;
        
        const { error: createError } = await supabase.rpc('execute_sql', { sql: createSql });
        
        if (createError) {
          console.error("❌ Failed to create execute_sql function:", createError);
          
          // Try direct query - this is a fallback but won't work with most Supabase setups
          try {
            await supabase.from('_postgrest_temp').select('*').limit(1);
            const { error: directError } = await supabase.from('_postgrest_temp').select('*').limit(1);
            
            if (directError) {
              console.error("❌ Direct query also failed:", directError);
              throw new Error(`execute_sql function is required: ${directError.message}`);
            }
          } catch (directErr) {
            console.error("❌ Direct fallback failed:", directErr);
            throw new Error(`execute_sql function is required: ${directErr.message}`);
          }
        } else {
          console.log("✅ Successfully created execute_sql function");
        }
      } catch (createErr) {
        console.error("❌ Error while creating execute_sql function:", createErr);
        throw new Error(`Failed to create required function: ${createErr.message}`);
      }
    }

    // Enable the pg_cron and pg_net extensions if they're not already enabled
    const { error: extensionError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        CREATE EXTENSION IF NOT EXISTS pg_net;
      `
    });

    if (extensionError) {
      console.error("❌ Error enabling extensions:", extensionError);
      throw new Error(`Failed to enable required extensions: ${extensionError.message}`);
    } else {
      console.log("✅ Required extensions enabled successfully");
    }

    // Get the Supabase anon key to use in the cron job
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anonKey) {
      throw new Error("Missing Supabase anon key");
    }

    // Get the project reference from the URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
    if (!projectRef) {
      throw new Error("Could not extract project reference from Supabase URL");
    }

    console.log(`📊 Project reference: ${projectRef}`);

    // Form the function URL
    const functionUrl = `https://${projectRef}.functions.supabase.co/process-notification-queue`;
    console.log(`🔗 Function URL: ${functionUrl}`);

    // Check if cron job already exists
    const checkJobSql = `
      SELECT * FROM cron.job WHERE jobname = 'process_notifications';
    `;

    const { data: existingJobs, error: checkError } = await supabase.rpc('execute_sql', { 
      sql: checkJobSql 
    });

    if (checkError) {
      console.error("❌ Error checking for existing cron job:", checkError);
      throw new Error(`Failed to check for existing cron job: ${checkError.message}`);
    }

    // If job exists, remove it first to avoid duplicates
    if (existingJobs && existingJobs.length > 0) {
      console.log("🗑️ Removing existing cron job");
      
      const dropJobSql = `
        SELECT cron.unschedule('process_notifications');
      `;
      
      const { error: dropError } = await supabase.rpc('execute_sql', { 
        sql: dropJobSql 
      });
      
      if (dropError) {
        console.error("❌ Error removing existing cron job:", dropError);
        throw new Error(`Failed to remove existing cron job: ${dropError.message}`);
      }
    }

    // Create the cron job to call our function every minute
    const createJobSql = `
      SELECT cron.schedule(
        'process_notifications',
        '* * * * *',  -- Run every minute
        $$
        SELECT
          net.http_post(
            url:='${functionUrl}',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${anonKey}"}'::jsonb,
            body:='{}'::jsonb
          ) AS request_id;
        $$
      );
    `;

    const { error: scheduleError } = await supabase.rpc('execute_sql', { 
      sql: createJobSql 
    });

    if (scheduleError) {
      console.error("❌ Error creating cron job:", scheduleError);
      throw new Error(`Failed to create cron job: ${scheduleError.message}`);
    }

    console.log("✅ Notification processing cron job set up successfully");

    // Run the notification processing immediately as a test
    console.log("🔄 Processing any pending notifications immediately");
    try {
      const { data: processData, error: processError } = await supabase.functions.invoke('process-notification-queue');
      
      if (processError) {
        console.error("⚠️ Error during immediate notification processing:", processError);
        // Don't throw, this is just a test
      } else {
        console.log("✅ Immediate notification processing result:", processData);
      }
    } catch (processErr) {
      console.error("⚠️ Exception during immediate notification processing:", processErr);
      // Don't throw, this is just a test
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Notification processing cron job has been set up to run every minute",
      function_url: functionUrl
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("❌ Error setting up cron job:", err);
    
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "An unexpected error occurred"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
