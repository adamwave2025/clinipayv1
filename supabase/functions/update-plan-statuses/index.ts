
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jbtxxlkhiubuzanegtzn.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Check if a plan has overdue payments
 * This function only checks if any payments are past due
 * It doesn't attempt to determine the overall plan status
 */
async function checkPlanForOverduePayments(supabase: any, planId: string): Promise<boolean> {
  try {
    // Get current date in YYYY-MM-DD format for overdue check
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if any payment is past its due date and not paid/cancelled/paused
    const { data, error } = await supabase
      .from('payment_schedule')
      .select('id')
      .eq('plan_id', planId)
      .in('status', ['pending', 'sent'])
      .lt('due_date', todayStr)
      .limit(1);
      
    if (error) throw error;
    
    // Return true if we found any overdue payments
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error checking for overdue payments in plan ${planId}:`, error);
    return false;
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
    
    // 1. Get all plans that are active, pending, or overdue (not paused, cancelled or completed)
    const { data: activePlans, error: plansError } = await supabase
      .from('plans')
      .select('id, title, status, has_overdue_payments')
      .in('status', ['active', 'pending', 'overdue']); // Only check these statuses
    
    if (plansError) {
      throw new Error(`Error fetching active plans: ${plansError.message}`);
    }
    
    console.log(`📋 Found ${activePlans?.length || 0} active/pending/overdue plans to check`);
    
    // Track results for reporting
    const updatedPlans = [];
    const updatedSchedules = [];
    const errors = [];
    
    // 2. For each plan, check and update overdue payments
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
          
          // If we found and updated overdue payments, set plan status to overdue
          // But only if plan is not already 'completed', 'cancelled' or 'paused'
          if (plan.status !== 'overdue') {
            console.log(`Setting plan ${plan.id} status from ${plan.status} to overdue`);
            
            const { error: planUpdateError } = await supabase
              .from('plans')
              .update({ 
                status: 'overdue',
                has_overdue_payments: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', plan.id);
              
            if (planUpdateError) {
              throw new Error(`Error updating plan ${plan.id}: ${planUpdateError.message}`);
            }
            
            updatedPlans.push({
              plan_id: plan.id,
              title: plan.title,
              previous_status: plan.status,
              new_status: 'overdue'
            });
          }
        } else {
          // If no overdue payments found, check if plan is marked as overdue but shouldn't be
          if (plan.status === 'overdue') {
            const hasActualOverduePayments = await checkPlanForOverduePayments(supabase, plan.id);
            
            if (!hasActualOverduePayments) {
              // No overdue payments, so plan shouldn't be overdue
              // Change to 'active' if at least one payment has been made, otherwise 'pending'
              const { data: paidCount, error: paidError } = await supabase
                .from('payment_schedule')
                .select('id', { count: 'exact', head: true })
                .eq('plan_id', plan.id)
                .eq('status', 'paid');
                
              if (paidError) {
                throw new Error(`Error checking paid payments: ${paidError.message}`);
              }
              
              const newStatus = paidCount && paidCount > 0 ? 'active' : 'pending';
              console.log(`Plan ${plan.id} is marked overdue but has no overdue payments, changing to ${newStatus}`);
              
              const { error: updateError } = await supabase
                .from('plans')
                .update({ 
                  status: newStatus,
                  has_overdue_payments: false,
                  updated_at: new Date().toISOString()
                })
                .eq('id', plan.id);
                
              if (updateError) {
                throw new Error(`Error updating plan status: ${updateError.message}`);
              }
              
              updatedPlans.push({
                plan_id: plan.id,
                title: plan.title,
                previous_status: plan.status,
                new_status: newStatus
              });
            }
          }
        }
        
        // Always update the has_overdue_payments flag to be accurate
        const hasActualOverduePayments = await checkPlanForOverduePayments(supabase, plan.id);
        
        if (plan.has_overdue_payments !== hasActualOverduePayments) {
          console.log(`Updating has_overdue_payments flag for plan ${plan.id} to ${hasActualOverduePayments}`);
          
          const { error: flagUpdateError } = await supabase
            .from('plans')
            .update({ 
              has_overdue_payments: hasActualOverduePayments,
              updated_at: new Date().toISOString()
            })
            .eq('id', plan.id);
            
          if (flagUpdateError) {
            console.error(`Error updating overdue flag: ${flagUpdateError.message}`);
          }
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
