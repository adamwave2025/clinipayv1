
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables for Supabase client');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { planId, resumeDate } = await req.json();
    
    if (!planId) {
      throw new Error('Missing required parameter: planId');
    }
    
    if (!resumeDate) {
      throw new Error('Missing required parameter: resumeDate');
    }
    
    console.log(`Debugging resume plan: ${planId} with date: ${resumeDate}`);
    
    // Get current payment schedule state
    const { data: beforeSchedule, error: beforeError } = await supabase
      .from('payment_schedule')
      .select('id, payment_number, due_date, status')
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
      
    if (beforeError) {
      throw new Error(`Error fetching payment schedule: ${beforeError.message}`);
    }
    
    console.log('Before resume state:', JSON.stringify(beforeSchedule, null, 2));
    
    // Check how many payments are in paused status
    const pausedPayments = beforeSchedule.filter(payment => payment.status === 'paused');
    console.log(`Found ${pausedPayments.length} paused payments to resume`);
    
    if (pausedPayments.length === 0) {
      throw new Error('No paused payments found to resume');
    }
    
    // Check the plan's current status
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('status')
      .eq('id', planId)
      .single();
      
    if (planError) {
      throw new Error(`Error fetching plan: ${planError.message}`);
    }
    
    console.log(`Plan status before resuming: ${planData.status}`);
    
    if (planData.status !== 'paused') {
      throw new Error(`Plan is in ${planData.status} status and cannot be resumed`);
    }
    
    // Call the resume_payment_plan function with proper parameters
    const { data: result, error } = await supabase
      .rpc('resume_payment_plan', { 
        plan_id: planId,
        resume_date: resumeDate,
        payment_status: 'paused'
      });
      
    if (error) {
      console.error('Error calling resume_payment_plan:', error);
      throw new Error(`Error calling resume_payment_plan: ${error.message}`);
    }
    
    console.log('Resume function result:', JSON.stringify(result, null, 2));
    
    // Check if we got the expected success response
    if (!result || typeof result !== 'object' || !('success' in result)) {
      throw new Error('Invalid response from resume_payment_plan function');
    }
    
    if (result.success !== true) {
      throw new Error(`Resume operation failed: ${result.message || 'Unknown error'}`);
    }
    
    // Get updated payment schedule after the function call
    const { data: afterSchedule, error: afterError } = await supabase
      .from('payment_schedule')
      .select('id, payment_number, due_date, status')
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
      
    if (afterError) {
      throw new Error(`Error fetching updated payment schedule: ${afterError.message}`);
    }
    
    console.log('After resume state:', JSON.stringify(afterSchedule, null, 2));
    
    // Now we need to update the payment statuses from paused to pending
    console.log('Updating payment statuses from paused to pending');
    const { error: statusUpdateError } = await supabase
      .from('payment_schedule')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('plan_id', planId)
      .eq('status', 'paused');
    
    if (statusUpdateError) {
      throw new Error(`Error updating payment status to pending: ${statusUpdateError.message}`);
    }
    
    // Update the plan status to active
    const { error: planUpdateError } = await supabase
      .from('plans')
      .update({ 
        status: 'active', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', planId);
    
    if (planUpdateError) {
      throw new Error(`Error updating plan status: ${planUpdateError.message}`);
    }
    
    console.log('Plan status updated to active');
    
    // Get final payment schedule state
    const { data: finalSchedule } = await supabase
      .from('payment_schedule')
      .select('id, payment_number, due_date, status')
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
    
    console.log('Final payment schedule state:', JSON.stringify(finalSchedule, null, 2));
    
    // Return the full debugging information
    return new Response(
      JSON.stringify({
        success: true,
        planId,
        resumeDate,
        result,
        before: beforeSchedule,
        after: afterSchedule,
        final: finalSchedule
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Error in resume-plan-debug function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
