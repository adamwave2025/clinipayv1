
// This is a debug edge function to help diagnose issues with resuming plans
// It will call the resume_payment_plan database function directly and return the result
// This can help identify if the issue is with the database function, the TypeScript code, or something else

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }
  
  try {
    // Get the request body
    const requestData = await req.json()
    const { plan_id, resume_date, payment_status = 'paused', update_statuses = false } = requestData
    
    if (!plan_id || !resume_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: plan_id and resume_date are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('Resuming plan with parameters:', { plan_id, resume_date, payment_status, update_statuses })
    
    // First check if the plan exists and is in paused status
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('id, status')
      .eq('id', plan_id)
      .single()
    
    if (planError) {
      console.error('Error fetching plan:', planError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch plan: ${planError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    
    console.log('Plan found with status:', planData.status)
    
    // Check if there are any paused payments 
    const { data: pausedPayments, error: pausedError } = await supabase
      .from('payment_schedule')
      .select('id')
      .eq('plan_id', plan_id)
      .eq('status', payment_status)
    
    if (pausedError) {
      console.error('Error fetching paused payments:', pausedError)
      return new Response(
        JSON.stringify({ error: `Error fetching paused payments: ${pausedError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    console.log(`Found ${pausedPayments?.length || 0} ${payment_status} payments`)
    
    // Step 1: Call the database function to reschedule due dates
    console.log('Calling resume_payment_plan with params:', { plan_id, resume_date, payment_status })
    const { data: result, error } = await supabase.rpc('resume_payment_plan', {
      plan_id,
      resume_date,
      payment_status,
    })
    
    if (error) {
      console.error('Error from resume_payment_plan:', error)
      return new Response(
        JSON.stringify({ 
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    console.log('Database function result:', result)
    
    // Step 2: Now update the status from paused to pending (if requested)
    let statusUpdateResult = null
    let statusUpdateError = null
    
    if (update_statuses && result.success) {
      console.log('Now updating payment statuses from paused to pending')
      
      const { data, error: updateError } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', plan_id)
        .eq('status', payment_status)
        .select()
      
      if (updateError) {
        console.error('Error updating payment status to pending:', updateError)
        statusUpdateError = updateError
      } else {
        console.log(`Successfully updated ${data?.length || 0} payments from ${payment_status} to pending`, data)
        statusUpdateResult = data
      }
      
      // Update plan status too
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ 
          status: 'active', 
          updated_at: new Date().toISOString()
        })
        .eq('id', plan_id)
        
      if (planUpdateError) {
        console.error('Error updating plan status:', planUpdateError)
      } else {
        console.log('Successfully updated plan status to active')
      }
    }
    
    // Return the combined results
    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        planStatus: planData.status,
        pausedPaymentsCount: pausedPayments?.length || 0,
        statusUpdateResult,
        statusUpdateError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
