
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jbtxxlkhiubuzanegtzn.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Check if a payment schedule entry has been paid
 * This is a safeguard to ensure we never change paid statuses
 */
function isSchedulePaid(schedule: any): boolean {
  return (
    schedule.payment_request_id !== null && 
    schedule.payment_requests !== null &&
    schedule.payment_requests.payment_id !== null
  );
}

/**
 * Get allowed status transitions for a given status
 */
function getAllowedStatusTransitions(currentStatus: string): string[] {
  const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
    'pending': ['overdue', 'paused', 'cancelled'],
    'sent': ['overdue', 'paid', 'paused', 'cancelled'],  // Added 'overdue' as valid transition from 'sent'
    'paid': ['refunded', 'partially_refunded'],
    'overdue': ['paid', 'paused', 'cancelled'],
    'paused': ['pending', 'cancelled'],
    'cancelled': [],
    'refunded': [],
    'partially_refunded': ['refunded']
  };
  
  return ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a status transition is valid
 */
function isStatusTransitionValid(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return true;
  return getAllowedStatusTransitions(currentStatus).includes(newStatus);
}

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
    const updatedSchedules = [];
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
          // IMPORTANT: Never mark a paid payment as overdue
          const isPaid = isSchedulePaid(schedule);
          
          // FIXED: Compare dates without the time component
          // Convert both dates to YYYY-MM-DD format and then compare them
          const dueDateStr = new Date(schedule.due_date).toISOString().split('T')[0];
          const todayStr = today.toISOString().split('T')[0];
          
          // A payment is overdue if:
          // 1. It's not paid
          // 2. The due date is strictly before today (not including today)
          // 3. It's not paused
          const isOverdue = !isPaid && 
                           dueDateStr < todayStr && 
                           schedule.status !== 'paused' &&
                           schedule.status !== 'overdue'; // Don't count already overdue items
          
          return isOverdue;
        });
        
        // If there are overdue payments and the plan doesn't already have has_overdue_payments=true
        if (overduePayments.length > 0) {
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
          
          // NEW: Update each overdue payment schedule item to 'overdue' status
          const overdueIds = overduePayments.map(payment => payment.id);
          
          if (overdueIds.length > 0) {
            console.log(`Updating ${overdueIds.length} payment schedules to overdue status`);
            
            // Batch update all overdue payment schedules
            const { error: scheduleUpdateError } = await supabase
              .from('payment_schedule')
              .update({ 
                status: 'overdue'
              })
              .in('id', overdueIds);
            
            if (scheduleUpdateError) {
              console.error(`Warning: Failed to update schedule statuses: ${scheduleUpdateError.message}`);
            } else {
              updatedSchedules.push(...overdueIds);
              console.log(`Successfully updated ${overdueIds.length} payment schedules to overdue status`);
            }
          }
          
          // Record this update in the activity log using the new 'overdue' action type
          const { error: activityError } = await supabase
            .from('payment_activity') // Using the correct table name
            .insert({
              patient_id: null,  // Will be populated from the plan data
              payment_link_id: null,  // Will be populated from the plan data
              clinic_id: null,  // Will be populated from the plan data
              action_type: 'overdue',
              details: {
                previous_status: plan.status,
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
        schedules_updated: updatedSchedules.length,
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
