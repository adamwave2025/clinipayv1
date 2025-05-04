
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jbtxxlkhiubuzanegtzn.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Setting up plan status update cron job');
    
    // Initialize Supabase client with service role key (needed for RLS bypass)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, check if the cron job already exists
    const { data: existingCronJob, error: checkError } = await supabase.rpc(
      'execute_sql',
      { 
        sql: "SELECT * FROM cron.job WHERE jobname = 'update_plan_statuses_job'"
      }
    );
    
    if (checkError) {
      console.error('Error checking for existing cron job:', checkError);
    }
    
    // If job already exists, remove it first
    if (existingCronJob && existingCronJob.length > 0) {
      console.log('Found existing cron job, removing it first...');
      
      const { data: deleteResult, error: deleteError } = await supabase.rpc(
        'execute_sql',
        { 
          sql: "SELECT cron.unschedule('update_plan_statuses_job')"
        }
      );
      
      if (deleteError) {
        throw new Error(`Failed to remove existing cron job: ${deleteError.message}`);
      }
      
      console.log('Successfully removed existing cron job');
    }
    
    // Create the cron job to run every minute
    const { data: cronResult, error: cronError } = await supabase.rpc(
      'execute_sql',
      { 
        sql: `
          SELECT cron.schedule(
            'update_plan_statuses_job',
            '* * * * *', -- every minute
            $$
              SELECT
                net.http_post(
                  url:='https://jbtxxlkhiubuzanegtzn.supabase.co/functions/v1/update-plan-statuses',
                  headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidHh4bGtoaXVidXphbmVndHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMjU3MTIsImV4cCI6MjA1OTcwMTcxMn0.Pe8trGeGMCmJ61zEFbkaPJidKnmxVOWkLExPa-TNn9I"}'::jsonb,
                  body:=concat('{"triggered_at": "', now(), '"}')::jsonb
                ) as request_id;
            $$
          );
        `
      }
    );
    
    if (cronError) {
      throw new Error(`Failed to create cron job: ${cronError.message}`);
    }
    
    console.log('Successfully set up plan status update cron job');
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Plan status update cron job successfully scheduled',
        details: 'Job will run every minute to check for and update overdue payment plans',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error setting up plan status update cron job:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
