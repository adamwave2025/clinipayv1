import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Service responsible for payment plan management operations
 */
export class PlanService {
  /**
   * Update a payment plan's status and metrics after a payment
   */
  static async updatePlanAfterPayment(
    supabaseClient: any, 
    scheduleData: any,
    paymentReference: string,
    amountInCents: number,
    paymentId: string
  ) {
    try {
      if (!scheduleData.plan_id) {
        console.log(`No plan_id associated with payment schedule entry`);
        return;
      }
      
      console.log(`Updating parent plan with ID: ${scheduleData.plan_id}`);
      
      // First get current plan data to update correctly
      const { data: planData, error: planFetchError } = await supabaseClient
        .from("plans")
        .select("*")
        .eq("id", scheduleData.plan_id)
        .single();
      
      if (planFetchError) {
        console.error("Error fetching plan data:", planFetchError);
        return;
      }
      
      if (!planData) {
        console.error(`Plan with ID ${scheduleData.plan_id} not found`);
        return;
      }
      
      // MODIFIED: Count actual paid installments from payment_schedule table
      // instead of incrementing a counter
      const { count: paidInstallments, error: countError } = await supabaseClient
        .from("payment_schedule")
        .select("id", { count: 'exact', head: true })
        .eq("plan_id", scheduleData.plan_id)
        .eq("status", "paid");
        
      if (countError) {
        console.error("Error counting paid installments:", countError);
        // Fallback to old method if count fails
        console.log("Falling back to increment method for paid installments");
      }
      
      // Use counted value if available, otherwise fallback to increment method
      const totalPaid = countError ? 
        Math.min((planData.paid_installments || 0) + 1, planData.total_installments) :
        paidInstallments;
        
      const totalInstallments = planData.total_installments || scheduleData.total_payments;
      
      // Calculate new progress percentage - Cap at 100%
      const progress = Math.min(Math.floor((totalPaid / totalInstallments) * 100) || 0, 100);

      // Get all schedule entries for this plan to find next due date and check for overdue
      const { data: allScheduleEntries, error: entriesError } = await supabaseClient
        .from("payment_schedule")
        .select("*")
        .eq("plan_id", scheduleData.plan_id)
        .order("due_date", { ascending: true });
              
      if (entriesError) {
        console.error("Error fetching all schedule entries:", entriesError);
        throw entriesError;
      }
      
      // Find the next due date from remaining unpaid installments
      let nextDueDate = null;
      
      if (allScheduleEntries) {
        // Find first unpaid entry
        const unpaidEntry = allScheduleEntries.find(entry => 
          entry.status !== 'paid' && entry.status !== 'cancelled'
        );
        
        if (unpaidEntry) {
          nextDueDate = unpaidEntry.due_date;
          console.log(`Found next due date: ${nextDueDate} for plan ${scheduleData.plan_id}`);
        } else {
          console.log(`No more unpaid entries found for plan ${scheduleData.plan_id}`);
        }

        // SIMPLIFIED STATUS LOGIC:
        // 1. If all installments are paid -> completed
        // 2. If not paused/cancelled and at least one payment made -> active
        // 3. Only override with overdue if plan was already overdue
        
        // Start with current status
        let newStatus = planData.status;
        console.log(`Current plan status: ${newStatus}`);
        
        // If all installments are paid, mark as completed (overrides all other status changes)
        if (totalPaid >= totalInstallments) {
          newStatus = 'completed';
          console.log(`All installments paid (${totalPaid}/${totalInstallments}), marking plan as completed`);
        } 
        // Any payment made on a plan that's not cancelled or completed should make it active
        else if (newStatus !== 'cancelled' && newStatus !== 'completed' && newStatus !== 'paused') {
          // SIMPLIFIED: Always set to active when a payment is made (unless completed, cancelled or paused)
          newStatus = 'active';
          console.log(`Payment made, setting plan status to active`);
        }
        
        // Debug logs for plan update
        console.log(`Plan update details:
          - Plan ID: ${planData.id}
          - Old status: ${planData.status}
          - New status: ${newStatus}
          - Paid installments: ${totalPaid}/${totalInstallments}
          - Progress: ${progress}%
          - Next due date: ${nextDueDate || 'None'}
        `);
        
        // Update the plan with new values - REMOVED has_overdue_payments field
        const { error: planUpdateError } = await supabaseClient
          .from("plans")
          .update({
            paid_installments: totalPaid,
            progress: progress,
            next_due_date: nextDueDate,
            status: newStatus
          })
          .eq("id", scheduleData.plan_id);
        
        if (planUpdateError) {
          console.error("Error updating plan record:", planUpdateError);
        } else {
          console.log(`Successfully updated plan record. New status: ${newStatus}, Progress: ${progress}%, Next due date: ${nextDueDate || 'None'}`);
        }

        // Record payment activity in the payment plan activity log
        await PlanService.recordPaymentActivity(
          supabaseClient,
          scheduleData,
          paymentReference,
          amountInCents,
          paymentId
        );
      }
    } catch (error) {
      console.error("Error updating plan after payment:", error);
    }
  }

  /**
   * Record payment activity for a plan
   */
  static async recordPaymentActivity(
    supabaseClient: any,
    scheduleData: any,
    paymentReference: string,
    amountInCents: number,
    paymentId: string
  ) {
    try {
      const activityPayload = {
        patient_id: scheduleData.patient_id,
        payment_link_id: scheduleData.payment_link_id,
        clinic_id: scheduleData.clinic_id,
        action_type: "payment_made",
        plan_id: scheduleData.plan_id, // Add plan_id to ensure proper tracking
        details: {
          payment_reference: paymentReference,
          amount: amountInCents,
          payment_date: new Date().toISOString(),
          payment_number: scheduleData.payment_number,
          total_payments: scheduleData.total_payments,
          payment_id: paymentId
        }
      };
      
      console.log("Recording payment activity in plan history:", JSON.stringify(activityPayload));
      
      const { error: activityError } = await supabaseClient
        .from("payment_activity")
        .insert(activityPayload);
        
      if (activityError) {
        console.error("Error recording payment activity:", activityError);
      } else {
        console.log("Successfully recorded payment activity in plan history");
      }
    } catch (error) {
      console.error("Error recording payment activity:", error);
    }
  }

  /**
   * Update a payment plan after a refund is processed
   */
  static async updatePlanAfterRefund(
    supabaseClient: any,
    paymentRequestId: string,
    isFullRefund: boolean
  ) {
    try {
      // Check if this payment request is part of a payment plan
      const { data: scheduleData, error: scheduleError } = await supabaseClient
        .from("payment_schedule")
        .select("id, plan_id")
        .eq("payment_request_id", paymentRequestId)
        .maybeSingle();
        
      if (scheduleError) {
        console.error("Error checking for payment schedule:", scheduleError);
        return;
      }
      
      if (!scheduleData) {
        console.log("No payment schedule found for this payment request");
        return;
      }
      
      console.log(`Found associated payment schedule: ${scheduleData.id}`);
      
      // Update the payment schedule status
      const { error: updateScheduleError } = await supabaseClient
        .from("payment_schedule")
        .update({
          status: isFullRefund ? 'refunded' : 'partially_refunded'
        })
        .eq("id", scheduleData.id);
        
      if (updateScheduleError) {
        console.error("Error updating payment schedule:", updateScheduleError);
        return;
      }
      
      console.log(`Updated payment schedule ${scheduleData.id} status to ${isFullRefund ? 'refunded' : 'partially_refunded'}`);
      
      // MODIFIED: Do not reduce the paid_installments count even for full refunds
      // We'll just update the status of the payment schedule item but leave the plan's
      // paid_installments count unchanged
      
      if (scheduleData.plan_id) {
        console.log(`Plan ${scheduleData.plan_id} metrics will not be adjusted for refunded payments`);
        
        // MODIFIED: Only update the plan with a status change if needed,
        // but don't decrease the paid_installments count
        
        // Get the current plan data just to log information
        const { data: planData, error: planError } = await supabaseClient
          .from("plans")
          .select("total_installments, paid_installments")
          .eq("id", scheduleData.plan_id)
          .single();
          
        if (planError) {
          console.error("Error fetching plan data:", planError);
          return;
        }
        
        if (!planData) {
          console.error(`Plan with ID ${scheduleData.plan_id} not found`);
          return;
        }
        
        console.log(`Plan metrics remaining unchanged: paid_installments=${planData.paid_installments}, total=${planData.total_installments}`);
      }
    } catch (error) {
      console.error("Error updating plan after refund:", error);
    }
  }
}
