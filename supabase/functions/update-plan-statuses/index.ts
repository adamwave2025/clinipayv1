
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
    console.log('🔄 Starting plan status update process at', new Date().toISOString());
    
    // Initialize Supabase client with service role key (needed for RLS bypass)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current date in YYYY-MM-DD format (adjusted for UTC)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`📅 Checking for overdue payments before: ${todayStr}`);
    
    // 1. First get all active or pending plans
    const { data: activePlans, error: plansError } = await supabase
      .from('plans')
      .select('id, title, status, has_overdue_payments')
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });
    
    if (plansError) {
      throw new Error(`Error fetching active plans: ${plansError.message}`);
    }
    
    console.log(`📋 Found ${activePlans.length} active/pending plans to check`);
    
    // Track results for reporting
    const updatedPlans = [];
    const errors = [];
    
    // 2. For each plan, check if any payments are overdue
    for (const plan of activePlans) {
      try {
        console.log(`🔍 Checking plan ${plan.id} (${plan.title || 'Untitled Plan'})`);
        
        // Get all payment schedules for this plan
        const { data: schedules, error: scheduleError } = await supabase
          .from('payment_schedule')
          .select(`
            id, 
            payment_number, 
            due_date, 
            status,
            payment_request_id,
            payment_requests (
              payment_id,
              status
            )
          `)
          .eq('plan_id', plan.id)
          .not('status', 'eq', 'cancelled')
          .not('status', 'eq', 'paused');
        
        if (scheduleError) {
          throw new Error(`Error fetching schedules for plan ${plan.id}: ${scheduleError.message}`);
        }
        
        // Check if any payment is overdue
        const overduePayments = schedules.filter(schedule => {
          // Check if the schedule is not paid and due date has passed
          const isPaid = schedule.payment_request_id !== null && 
                         schedule.payment_requests !== null &&
                         schedule.payment_requests.payment_id !== null;
          
          const dueDate = new Date(schedule.due_date);
          const isOverdue = !isPaid && dueDate < today && schedule.status !== 'paused';
          
          return isOverdue;
        });
        
        // If there are overdue payments and the plan doesn't already have has_overdue_payments=true
        if (overduePayments.length > 0 && (!plan.has_overdue_payments || plan.status !== 'overdue')) {
          console.log(`⚠️ Found ${overduePayments.length} overdue payments for plan ${plan.id}`);
          
          // Update the plan status to overdue
          const { error: updateError } = await supabase
            .from('plans')
            .update({ 
              has_overdue_payments: true,
              status: 'overdue'
            })
            .eq('id', plan.id);
          
          if (updateError) {
            throw new Error(`Error updating plan ${plan.id}: ${updateError.message}`);
          }
          
          // Record this update in the activity log
          const { error: activityError } = await supabase
            .from('payment_plan_activities')
            .insert({
              patient_id: null,  // Will be populated from the plan data
              payment_link_id: null,  // Will be populated from the plan data
              clinic_id: null,  // Will be populated from the plan data
              action_type: 'status_update',
              details: {
                old_status: plan.status,
                new_status: 'overdue',
                reason: 'Overdue payments detected',
                overdue_count: overduePayments.length,
                overdue_items: overduePayments.map(p => ({
                  id: p.id,
                  payment_number: p.payment_number,
                  due_date: p.due_date
                }))
              }
            });
          
          if (activityError) {
            console.error(`Warning: Failed to record activity for plan ${plan.id}: ${activityError.message}`);
          }
          
          updatedPlans.push({
            plan_id: plan.id,
            title: plan.title,
            overdue_count: overduePayments.length
          });
        } else {
          console.log(`✅ No overdue payments for plan ${plan.id} or already marked as overdue`);
        }
      } catch (planError) {
        console.error(`Error processing plan ${plan.id}:`, planError);
        errors.push({ plan_id: plan.id, error: planError.message });
      }
    }
    
    // Return summary of operations
    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        plans_checked: activePlans.length,
        plans_updated: updatedPlans.length,
        updated_plans: updatedPlans,
        errors: errors
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
    console.error('Error in update-plan-statuses function:', error);
    
    return new Response(
      JSON.stringify({ 
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
