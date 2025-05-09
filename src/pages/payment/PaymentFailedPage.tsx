
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import { usePaymentLinkData } from '@/modules/payment/hooks';
import { 
  PaymentStatusSummary, 
  ClinicInformationCard, 
  PaymentPageLoading 
} from '@/modules/payment/components';
import { RefreshCcw } from 'lucide-react';
import type { ClinicDetails } from '@/modules/payment/components/ClinicInformationCard';

const PaymentFailedReasons = () => (
  <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
    <h3 className="font-medium text-red-800 mb-2">Possible reasons:</h3>
    <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
      <li>Card was declined by your bank</li>
      <li>Insufficient funds in your account</li>
      <li>Payment details entered incorrectly</li>
      <li>Network or connection issues during payment</li>
      <li>Your card issuer declined the transaction</li>
    </ul>
  </div>
);

const PaymentFailedPage = () => {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('link_id');
  const navigate = useNavigate();
  const { linkData, isLoading } = usePaymentLinkData(linkId);
  
  // Try to load payment link data
  if (isLoading) {
    return <PaymentPageLoading />;
  }
  
  const handleTryAgain = () => {
    if (linkId) {
      navigate(`/payment/${linkId}`);
    } else {
      navigate('/');
    }
  };
  
  return (
    <PaymentLayout isSplitView={false}>
      <div className="max-w-lg mx-auto p-6">
        <PaymentStatusSummary 
          status="failed"
          title="Payment Failed"
          description="Your payment couldn't be processed. Please try again or contact the clinic for assistance."
          primaryActionLabel={<div className="flex items-center justify-center"><RefreshCcw className="w-4 h-4 mr-2" /> Try Again</div>}
          onPrimaryAction={handleTryAgain}
        />
        
        <PaymentFailedReasons />
        
        {linkData && linkData.clinic && (
          <ClinicInformationCard 
            clinicDetails={{
              name: linkData.clinic.name,
              logo: linkData.clinic.logo,
              email: linkData.clinic.email || '',
              phone: linkData.clinic.phone || '',
              address: linkData.clinic.address || ''
            } as ClinicDetails} 
          />
        )}
      </div>
    </PaymentLayout>
  );
};

export default PaymentFailedPage;
