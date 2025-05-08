
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

/**
 * Determine appropriate plan status based on payment history
 * This function follows the status priority rules:
 * 1. cancelled (highest priority)
 * 2. paused
 * 3. completed
 * 4. overdue
 * 5. active
 * 6. pending (lowest priority)
 */
async function determinePlanStatus(supabase: any, planId: string): Promise<string> {
  try {
    // Step 1: Get the plan record to check for manual override statuses
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('status, total_installments')
      .eq('id', planId)
      .single();
      
    if (planError) throw planError;
    
    // Priority 1: Check for manually set override statuses first (highest priority)
    if (plan.status === 'cancelled') {
      console.log(`Plan ${planId} status determined as: cancelled (manual override)`);
      return 'cancelled';
    }
    
    if (plan.status === 'paused') {
      console.log(`Plan ${planId} status determined as: paused (manual override)`);
      return 'paused';
    }
    
    // Step 2: Check if the plan is completed
    const { count: paidCount, error: paidError } = await supabase
      .from('payment_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId)
      .eq('status', 'paid');
      
    if (paidError) throw paidError;
    
    if (paidCount && paidCount >= plan.total_installments) {
      console.log(`Plan ${planId} status determined as: completed (all payments made)`);
      return 'completed';
    }
    
    // Step 3: Check for overdue payments
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const { data: overduePayments, error: overdueError } = await supabase
      .from('payment_schedule')
      .select('id')
      .eq('plan_id', planId)
      .not('status', 'in', ['paid', 'cancelled', 'paused'])
      .lt('due_date', todayStr)
      .limit(1);
      
    if (overdueError) throw overdueError;
    
    if (overduePayments && overduePayments.length > 0) {
      console.log(`Plan ${planId} status determined as: overdue (has overdue payments)`);
      return 'overdue';
    }
    
    // Step 4: Check for any paid payments
    const { data: anyPaidPayments, error: anyPaidError } = await supabase
      .from('payment_schedule')
      .select('id')
      .eq('plan_id', planId)
      .eq('status', 'paid')
      .limit(1);
      
    if (anyPaidError) throw anyPaidError;
    
    if (anyPaidPayments && anyPaidPayments.length > 0) {
      console.log(`Plan ${planId} status determined as: active (has at least one payment)`);
      return 'active';
    }
    
    // Default to pending
    console.log(`Plan ${planId} status determined as: pending (no payments made yet)`);
    return 'pending';
  } catch (error) {
    console.error('Error determining plan status:', error);
    return 'pending'; // Default to pending on error
  }
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
      .not('status', 'in', ['cancelled', 'paused', 'completed'])
      .order('created_at', { ascending: false });
    
    if (plansError) {
      throw new Error(`Error fetching active plans: ${plansError.message}`);
    }
    
    console.log(`📋 Found ${activePlans.length} active/pending/overdue plans to check`);
    
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
          .not('status', 'in', ['cancelled', 'paused', 'paid']);
        
        if (scheduleError) {
          throw new Error(`Error fetching schedules for plan ${plan.id}: ${scheduleError.message}`);
        }
        
        // Check if any payment is overdue
        const overduePayments = schedules.filter(schedule => {
          // Check if the schedule is not paid and due date has passed
          // IMPORTANT: Never mark a paid payment as overdue
          const isPaid = isSchedulePaid(schedule);
          
          // Compare dates without the time component
          // Convert both dates to YYYY-MM-DD format and then compare them
          const dueDateStr = new Date(schedule.due_date).toISOString().split('T')[0];
          
          // A payment is overdue if:
          // 1. It's not paid
          // 2. The due date is strictly before today (not including today)
          // 3. It's not already overdue
          const isOverdue = !isPaid && 
                           dueDateStr < todayStr && 
                           schedule.status !== 'overdue';
          
          return isOverdue;
        });
        
        // If there are overdue payments
        if (overduePayments.length > 0) {
          console.log(`⚠️ Found ${overduePayments.length} overdue payments for plan ${plan.id}`);
          
          // Update the overdue payment schedules to overdue status
          const overdueIds = overduePayments.map(payment => payment.id);
          
          if (overdueIds.length > 0) {
            console.log(`Updating ${overdueIds.length} payment schedules to overdue status`);
            
            // Batch update all overdue payment schedules
            const { error: scheduleUpdateError } = await supabase
              .from('payment_schedule')
              .update({ 
                status: 'overdue',
                updated_at: new Date().toISOString()
              })
              .in('id', overdueIds);
            
            if (scheduleUpdateError) {
              console.error(`Warning: Failed to update schedule statuses: ${scheduleUpdateError.message}`);
            } else {
              updatedSchedules.push(...overdueIds);
              console.log(`Successfully updated ${overdueIds.length} payment schedules to overdue status`);
            }
            
            // Determine the appropriate status for the plan using our priority rules
            const newStatus = await determinePlanStatus(supabase, plan.id);
            
            // Update the plan status accordingly
            const { error: updateError } = await supabase
              .from('plans')
              .update({ 
                status: newStatus,
                has_overdue_payments: newStatus === 'overdue'
              })
              .eq('id', plan.id);
            
            if (updateError) {
              throw new Error(`Error updating plan ${plan.id}: ${updateError.message}`);
            }
            
            // Record activity for tracking purposes
            const { error: activityError } = await supabase
              .from('payment_activity')
              .insert({
                plan_id: plan.id,
                action_type: 'overdue',
                details: {
                  previous_status: plan.status,
                  new_status: newStatus,
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
              previous_status: plan.status,
              new_status: newStatus,
              overdue_count: overduePayments.length
            });
          }
        } else {
          console.log(`✅ No overdue payments for plan ${plan.id} or already marked as overdue`);
        }
      } catch (planError: any) {
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
    
  } catch (error: any) {
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
