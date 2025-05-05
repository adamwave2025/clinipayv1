
import React, { useEffect, useState } from 'react';
import PaymentDetailsCard from './PaymentDetailsCard';
import { formatCurrency } from '@/utils/formatters';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentPlanBreakdownProps {
  planTotalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  isOverdue?: boolean;
  paymentLinkId?: string;
}

interface PaymentHistoryItem {
  date: string;
  amount: number;
}

const PaymentPlanBreakdown = ({ 
  planTotalAmount, 
  totalPaid, 
  totalOutstanding,
  isOverdue,
  paymentLinkId
}: PaymentPlanBreakdownProps) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch payment history if we have a payment link ID
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!paymentLinkId) return;
      
      setIsLoading(true);
      try {
        console.log(`PaymentPlanBreakdown: Fetching payment history for link ID: ${paymentLinkId}`);
        const { data, error } = await supabase
          .from("payments")
          .select("amount_paid, paid_at")
          .eq("payment_link_id", paymentLinkId)
          .eq("status", "paid")
          .order("paid_at", { ascending: false });
          
        if (error) {
          console.error("PaymentPlanBreakdown: Error fetching payment history:", error);
          return;
        }
        
        const formattedHistory = data.map((payment) => ({
          date: new Date(payment.paid_at).toLocaleDateString(),
          amount: payment.amount_paid / 100 // Convert cents to standard currency units
        }));
        
        console.log(`PaymentPlanBreakdown: Found ${formattedHistory.length} payments`);
        setPaymentHistory(formattedHistory);
      } catch (error) {
        console.error("PaymentPlanBreakdown: Exception fetching payment history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentHistory();
  }, [paymentLinkId]);

  const details = [
    { label: 'Plan Total', value: formatCurrency(planTotalAmount) },
    { label: 'Total Paid', value: formatCurrency(totalPaid) },
    { label: 'Total Outstanding', value: formatCurrency(totalOutstanding) }
  ];

  return (
    <div className="space-y-4">
      {isOverdue && (
        <div className="bg-red-50 border-l-4 border-red-400 p-2 text-sm text-red-700 flex items-start">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment Overdue</p>
            <p className="text-xs">This payment plan has overdue payments. Please contact the clinic if you're having difficulties making payments.</p>
          </div>
        </div>
      )}
      
      <PaymentDetailsCard 
        details={details} 
        className="bg-gray-50 p-3"
      />
      
      {/* Payment History Section */}
      {paymentHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Payment History</h4>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            {paymentHistory.map((payment, index) => (
              <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>{payment.date}</span>
                </div>
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="text-center text-sm text-gray-500 py-2">
          Loading payment history...
        </div>
      )}
    </div>
  );
};

export default PaymentPlanBreakdown;
