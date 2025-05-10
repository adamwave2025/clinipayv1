
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jbtxxlkhiubuzanegtzn.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Determine appropriate plan status based on payment history
 * This function implements the status priority rules:
 * 1. COMPLETED: All payments are 'paid' or 'refunded'
 * 2. OVERDUE: Any payment is past due and not paid/cancelled/paused
 * 3. ACTIVE: At least one payment is paid, some pending, no overdue
 * 4. PENDING: No payments made yet (all unpaid), not paused
 * 5. PAUSED: All unpaid payments are in 'paused' status
 * 6. CANCELLED: All payments are 'cancelled' (should be set manually though)
 */
async function determinePlanStatus(supabase: any, planId: string): Promise<string> {
  try {
    // Get current date in YYYY-MM-DD format for overdue check
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Step 1: Get all schedule entries for this plan
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('payment_schedule')
      .select('id, status, due_date')
      .eq('plan_id', planId);
      
    if (scheduleError) throw scheduleError;
    if (!scheduleData || scheduleData.length === 0) return 'pending';
    
    // Count payments in each status
    const statusCounts: Record<string, number> = {
      paid: 0,
      pending: 0,
      sent: 0,
      paused: 0,
      cancelled: 0,
      refunded: 0,
      partially_refunded: 0,
      overdue: 0
    };
    
    // Track if we have overdue payments that aren't yet marked as 'overdue'
    let hasActualOverduePayments = false;
    
    scheduleData.forEach((payment: any) => {
      // Count by status
      if (payment.status in statusCounts) {
        statusCounts[payment.status]++;
      }
      
      // Check for payments that are past due but not marked as overdue yet
      if (['pending', 'sent'].includes(payment.status) && payment.due_date < todayStr) {
        hasActualOverduePayments = true;
      }
    });
    
    const totalPayments = scheduleData.length;
    const paidOrRefundedPayments = statusCounts.paid + statusCounts.refunded + statusCounts.partially_refunded;
    const pausedOrCancelledPayments = statusCounts.paused + statusCounts.cancelled;
    const unpaidPayments = totalPayments - paidOrRefundedPayments;
    
    // Logic for determining status:
    
    // COMPLETED: All payments are paid or refunded
    if (paidOrRefundedPayments === totalPayments && totalPayments > 0) {
      console.log(`Plan ${planId} status: COMPLETED (all payments made)`);
      return 'completed';
    }
    
    // CANCELLED: Check if this is a manually cancelled plan (all payments cancelled)
    if (statusCounts.cancelled === totalPayments && totalPayments > 0) {
      console.log(`Plan ${planId} status: CANCELLED (manually set)`);
      return 'cancelled';
    }
    
    // PAUSED: All remaining (unpaid) payments are paused
    if (statusCounts.paused > 0 && statusCounts.paused === unpaidPayments) {
      console.log(`Plan ${planId} status: PAUSED (all remaining payments paused)`);
      return 'paused';
    }
    
    // OVERDUE: Any payment is overdue or should be marked overdue
    if (statusCounts.overdue > 0 || hasActualOverduePayments) {
      console.log(`Plan ${planId} status: OVERDUE (has overdue payments)`);
      return 'overdue';
    }
    
    // ACTIVE: At least one payment made, but not all
    if (paidOrRefundedPayments > 0) {
      console.log(`Plan ${planId} status: ACTIVE (some payments made)`);
      return 'active';
    }
    
    // PENDING: Default state, no payments made yet
    console.log(`Plan ${planId} status: PENDING (no payments made yet)`);
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
    
    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`📅 Checking for overdue payments before: ${todayStr}`);
    
    // 1. First get all plans that are not already cancelled or completed
    const { data: activePlans, error: plansError } = await supabase
      .from('plans')
      .select('id, title, status, has_overdue_payments')
      .not('status', 'in', '(cancelled,completed)');
    
    if (plansError) {
      throw new Error(`Error fetching active plans: ${plansError.message}`);
    }
    
    console.log(`📋 Found ${activePlans?.length || 0} active/pending/overdue/paused plans to check`);
    
    // Track results for reporting
    const updatedPlans = [];
    const updatedSchedules = [];
    const errors = [];
    
    // 2. For each plan, update status and check overdue payments
    for (const plan of activePlans || []) {
      try {
        console.log(`🔍 Checking plan ${plan.id} (${plan.title || 'Untitled Plan'})`);
        
        // First, update any overdue payments
        const { data: overdueUpdates, error: overdueError } = await supabase
          .from('payment_schedule')
          .update({ 
            status: 'overdue',
            updated_at: new Date().toISOString()
          })
          .eq('plan_id', plan.id)
          .in('status', ['pending', 'sent'])
          .lt('due_date', todayStr)
          .select('id');
          
        if (overdueError) {
          console.error(`Error updating overdue payments for plan ${plan.id}:`, overdueError);
        } else if (overdueUpdates && overdueUpdates.length > 0) {
          console.log(`Updated ${overdueUpdates.length} payments to overdue status for plan ${plan.id}`);
          updatedSchedules.push(...overdueUpdates.map(s => s.id));
        }
        
        // Now determine the plan status
        const newStatus = await determinePlanStatus(supabase, plan.id);
        const hasActualOverduePayments = newStatus === 'overdue';
        
        // Only update if status has changed
        if (plan.status !== newStatus || plan.has_overdue_payments !== hasActualOverduePayments) {
          console.log(`Updating plan ${plan.id} status from ${plan.status} to ${newStatus}`);
          
          const { error: updateError } = await supabase
            .from('plans')
            .update({ 
              status: newStatus,
              has_overdue_payments: hasActualOverduePayments,
              updated_at: new Date().toISOString()
            })
            .eq('id', plan.id);
            
          if (updateError) {
            throw new Error(`Error updating plan ${plan.id}: ${updateError.message}`);
          }
          
          updatedPlans.push({
            plan_id: plan.id,
            title: plan.title,
            previous_status: plan.status,
            new_status: newStatus
          });
        } else {
          console.log(`No status change needed for plan ${plan.id}, current status: ${plan.status}`);
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
        plans_checked: activePlans?.length || 0,
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
