import { Database } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlanPaymentMetrics } from './plan-status/PlanPaymentMetrics';

type Plans = Database['public']['Tables']['plans']['Row'];

export class PlanOperationsService {
  /**
   * Creates a new payment plan
   * @param clinicId
   * @param patientId
   * @param title
   * @param description
   * @param totalAmount
   * @param numberOfInstallments
   * @param interval
   * @param startDate
   */
  async createPlan(
    clinicId: string,
    patientId: string | null,
    title: string,
    description: string | null,
    totalAmount: number,
    numberOfInstallments: number,
    interval: 'weekly' | 'monthly',
    startDate: string,
    paymentLinkId: string | null
  ) {
    try {
      console.log('Creating new payment plan with:', {
        clinicId,
        patientId,
        title,
        description,
        totalAmount,
        numberOfInstallments,
        interval,
        startDate,
        paymentLinkId
      });

      // Insert the new plan
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          title: title,
          description: description,
          total_amount: totalAmount,
          total_installments: numberOfInstallments,
          interval: interval,
          start_date: startDate,
          status: 'active',
          payment_link_id: paymentLinkId
        })
        .select()
        .single();

      if (planError) {
        console.error('Error creating plan:', planError);
        toast.error('Error creating payment plan');
        return { success: false, error: planError };
      }

      console.log('New plan created:', planData);

      // Calculate the installment amount
      const installmentAmount = Math.round(totalAmount / numberOfInstallments);

      // Generate the payment schedule
      const paymentSchedule = [];
      let dueDate = new Date(startDate);

      for (let i = 1; i <= numberOfInstallments; i++) {
        paymentSchedule.push({
          plan_id: planData.id,
          amount: installmentAmount,
          due_date: dueDate.toISOString(),
          status: 'pending',
          payment_number: i,
          total_payments: numberOfInstallments
        });

        // Increment the due date based on the interval
        if (interval === 'weekly') {
          dueDate.setDate(dueDate.getDate() + 7);
        } else if (interval === 'monthly') {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
      }

      // Insert the payment schedule into the database
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('payment_schedule')
        .insert(paymentSchedule)
        .select();

      if (scheduleError) {
        console.error('Error creating payment schedule:', scheduleError);
        toast.error('Error creating payment schedule');

        // Delete the plan if the schedule fails to create
        await supabase.from('plans').delete().eq('id', planData.id);

        return { success: false, error: scheduleError };
      }

      console.log('Payment schedule created:', scheduleData);

      toast.success('Payment plan created successfully');
      return { success: true, plan: planData, schedule: scheduleData };
    } catch (error: any) {
      console.error('Error in createPlan:', error);
      toast.error('Error creating payment plan');
      return { success: false, error };
    }
  }

  /**
   * Updates an existing payment plan
   * @param planId
   * @param updates
   */
  async updatePlan(planId: string, updates: Partial<Plans>) {
    try {
      console.log(`Updating plan ${planId} with:`, updates);

      const { data, error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) {
        console.error('Error updating plan:', error);
        toast.error('Error updating payment plan');
        return { success: false, error };
      }

      console.log('Plan updated successfully:', data);
      toast.success('Payment plan updated successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('Error in updatePlan:', error);
      toast.error('Error updating payment plan');
      return { success: false, error };
    }
  }

  /**
   * Cancels a payment plan
   * @param planId
   */
  async cancelPlan(planId: string) {
    try {
      console.log(`Cancelling plan ${planId}`);

      // Update the plan status to 'cancelled'
      const { error: planError } = await supabase
        .from('plans')
        .update({ status: 'cancelled' })
        .eq('id', planId);

      if (planError) {
        console.error('Error cancelling plan:', planError);
        toast.error('Error cancelling payment plan');
        return { success: false, error: planError };
      }

      // Update the payment schedule status to 'cancelled'
      const { error: scheduleError } = await supabase
        .from('payment_schedule')
        .update({ status: 'cancelled' })
        .eq('plan_id', planId)
        .eq('status', 'pending');

      if (scheduleError) {
        console.error('Error cancelling payment schedule:', scheduleError);
        toast.error('Error cancelling payment schedule');
        return { success: false, error: scheduleError };
      }

      console.log('Plan cancelled successfully');
      toast.success('Payment plan cancelled successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error in cancelPlan:', error);
      toast.error('Error cancelling payment plan');
      return { success: false, error };
    }
  }

  /**
   * Marks an installment as paid
   * @param planId
   * @param installmentId
   */
  async markInstallmentPaid(planId: string, installmentId: string) {
    try {
      console.log(`Marking installment ${installmentId} as paid for plan ${planId}`);
    
    // First update the payment status to 'paid'
    const { error } = await supabase
      .from('payment_schedule')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', installmentId);
      
    if (error) {
      console.error('Error marking installment as paid:', error);
      toast.error('Error marking payment as paid');
      return { success: false, error };
    }
    
    // After marking as paid, get the schedule data for the activity log
    const { data: scheduleData } = await supabase
      .from('payment_schedule')
      .select('payment_number, total_payments, amount, due_date')
      .eq('id', installmentId)
      .single();

    // Try to get the payment record first to use its payment_ref
    const { data: paymentRecord } = await supabase
      .from('payments')
      .select('payment_ref')
      .eq('payment_schedule_id', installmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    // Use the payment reference from the record or generate a fallback
    let paymentReference = `CLN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    if (paymentRecord?.payment_ref) {
      paymentReference = paymentRecord.payment_ref;
      console.log('Using payment reference from payment record:', paymentReference);
    }
      
    if (scheduleData) {
      await this.logPlanActivity(planId, 'payment_marked_paid', { 
        payment_schedule_id: installmentId,
        payment_number: scheduleData.payment_number,
        total_payments: scheduleData.total_payments,
        amount: scheduleData.amount,
        dueDate: scheduleData.due_date,
        paidAt: new Date().toISOString(),
        manualPayment: true,
        paymentReference: paymentReference // Use the proper payment reference
      });
    }
    
    // Update the plan to reflect the new payment
    await this.updatePlanAfterPayment(planId);
    
    toast.success('Payment marked as paid');
    return { success: true };
  } catch (error: any) {
    console.error('Error in markInstallmentPaid:', error);
    toast.error('Error updating payment status');
    return { success: false, error };
  }
}

  /**
   * Logs activity related to a payment plan
   * @param planId
   * @param actionType
   * @param details
   */
  async logPlanActivity(planId: string, actionType: string, details: any) {
    try {
      console.log(`Logging activity for plan ${planId}:`, { actionType, details });

      const { data, error } = await supabase
        .from('plan_activity')
        .insert({
          plan_id: planId,
          action_type: actionType,
          details: details
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging plan activity:', error);
        return { success: false, error };
      }

      console.log('Plan activity logged successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error in logPlanActivity:', error);
      return { success: false, error };
    }
  }

  /**
   * Updates the plan after a payment has been made
   * @param planId
   */
  private async updatePlanAfterPayment(planId: string) {
    try {
      console.log(`Updating plan after payment: ${planId}`);

      // Get the plan details
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('total_installments, paid_installments')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error('Error fetching plan details:', planError);
        return { success: false, error: planError };
      }

      if (!planData) {
        console.error('Plan not found');
        return { success: false, error: 'Plan not found' };
      }

      // Calculate the new paid installments and progress
      const paidInstallments = (planData.paid_installments || 0) + 1;
      const progress = Math.round((paidInstallments / planData.total_installments) * 100);
      const isCompleted = progress >= 100;

      // Update the plan
      const { error: updateError } = await supabase
        .from('plans')
        .update({
          paid_installments: paidInstallments,
          progress: progress,
          status: isCompleted ? 'completed' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (updateError) {
        console.error('Error updating plan:', updateError);
        return { success: false, error: updateError };
      }

      console.log('Plan updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error in updatePlanAfterPayment:', error);
      return { success: false, error };
    }
  }
}
