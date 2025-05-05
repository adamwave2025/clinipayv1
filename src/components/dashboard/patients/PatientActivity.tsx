import React from 'react';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import StatusBadge from '@/components/common/StatusBadge';
import { CreditCard, RefreshCcw } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PaymentReferenceDisplay from '@/components/payment/PaymentReferenceDisplay';

interface PatientActivityProps {
  payments: any[];
  planActivities: any[]; // We'll keep this prop to maintain compatibility but won't use it
  isLoading?: boolean;  // Add the isLoading prop to the interface
}

const PatientActivity: React.FC<PatientActivityProps> = ({ payments, isLoading = false }) => {
  // Helper function to ensure consistent date parsing with timezone awareness
  const getDateTimestamp = (dateString: string): number => {
    if (!dateString) return 0;
    try {
      // For timestamps with timezone info (like PostgreSQL's +00), keep as is
      // For timestamps without timezone, interpret as UTC
      const isPostgresTimestamp = dateString.includes('+');
      const normalizedDate = isPostgresTimestamp ? 
        dateString : // PostgreSQL timestamps already have timezone info
        dateString.endsWith('Z') ? dateString : `${dateString}Z`; // Add Z if missing
      
      return new Date(normalizedDate).getTime();
    } catch (e) {
      console.error('Invalid date format:', dateString, e);
      return 0;
    }
  };

  // Only use payments now, ignore planActivities
  const paymentActivities = payments.sort((a, b) => {
    // Use our helper function to get timestamps consistently
    const dateA = getDateTimestamp(a.date);
    const dateB = getDateTimestamp(b.date);
    
    console.log(`Comparing payment dates: ${a.date} (${new Date(a.date).toISOString()}) vs ${b.date} (${new Date(b.date).toISOString()})`);
    console.log(`Payment timestamps: ${dateA} vs ${dateB}`);
    
    return dateB - dateA; // Newest first
  });
  
  console.log('Sorted payment activities:', paymentActivities);

  const getPaymentIcon = (payment: any) => {
    // Use appropriate icon based on payment status
    if (payment.status === 'refunded' || payment.status === 'partially_refunded') {
      return <RefreshCcw className="h-4 w-4 text-orange-500" />;
    } else {
      return <CreditCard className="h-4 w-4 text-clinipay-purple" />;
    }
  };

  const getPaymentDescription = (payment: any) => {
    // Handle payment activity description
    if (payment.status === 'paid') {
      return `Payment of ${formatCurrency(payment.amount)} received`;
    } else if (payment.status === 'refunded' || payment.status === 'partially_refunded') {
      return `Payment of ${formatCurrency(payment.amount)} ${payment.status}`;
    } else {
      return `Payment request of ${formatCurrency(payment.amount)} sent`;
    }
  };

  // New function to determine payment type (Payment Plan, Reusable Link, or Direct)
  const getPaymentType = (payment: any) => {
    if (payment.type === 'payment_plan') {
      return 'Payment Plan';
    } else if (payment.paymentLinkId) {
      return 'Reusable Link';
    } else {
      return 'Direct Payment';
    }
  };

  const getPaymentDetails = (payment: any) => {
    // Format the payment details, now focusing on payment title
    if (payment.linkTitle) {
      return payment.linkTitle;
    }
    
    // Fallback to type if no title available
    return payment.type ? `${payment.type.charAt(0).toUpperCase()}${payment.type.slice(1)}` : 'Payment';
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Patient Activity</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : paymentActivities.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No payment activity found for this patient
        </div>
      ) : (
        <div className="space-y-6">
          {paymentActivities.map((payment, index) => (
            <div key={`payment-${payment.id}-${index}`} className="mb-4">
              <p className="font-medium">{getPaymentDetails(payment)}</p>
              <p>Payment type: {getPaymentType(payment)}</p>
              {payment.reference && <p>Ref: {payment.reference}</p>}
              <p>{formatDateTime(payment.date, 'en-GB', 'Europe/London')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientActivity;
