
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentStatusSummary from '@/components/payment/PaymentStatusSummary';
import ClinicInformationCard from '@/components/payment/ClinicInformationCard';
import { RefreshCcw } from 'lucide-react';
import { usePaymentLinkData } from '@/hooks/usePaymentLinkData';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const PaymentFailedReasons = () => (
  <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
    <h3 className="font-medium text-red-800 mb-2">Possible reasons:</h3>
    <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
      <li>Insufficient funds in your account</li>
      <li>Card details entered incorrectly</li>
      <li>Card has expired or been cancelled</li>
      <li>Transaction was declined by your bank</li>
      <li>Temporary issue with payment processor</li>
      <li>The payment link may be invalid or expired</li>
    </ul>
  </div>
);

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('link_id');
  const [loading, setLoading] = useState(!!linkId);
  const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);
  
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);
  
  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
      if (error) {
        setDiagnosticInfo(`Error: ${error}`);
      } else if (!linkData) {
        setDiagnosticInfo("No payment link data found.");
      }
    }
  }, [isLoading, error, linkData]);

  const handleTryAgain = () => {
    if (linkId) {
      navigate(`/payment/${linkId}`);
    } else {
      navigate('/payment');
    }
  };
  
  if (loading) {
    return (
      <PaymentLayout hideHeaderFooter={true}>
        <div className="flex flex-col items-center justify-center">
          <LoadingSpinner size="md" />
          <p className="mt-3 text-gray-500">Loading payment details...</p>
        </div>
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout hideHeaderFooter={true}>
      <PaymentStatusSummary
        status="failed"
        title="Payment Failed"
        description="Your payment could not be processed. Please check your payment details and try again."
        primaryActionLabel={
          <>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </>
        }
        onPrimaryAction={handleTryAgain}
      />
      
      <PaymentFailedReasons />
      
      {diagnosticInfo && (
        <div className="mt-2 mb-4 p-2 bg-gray-100 rounded-md text-xs text-gray-700 font-mono">
          {diagnosticInfo}
        </div>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          If you continue to experience issues, please contact the clinic directly.
        </p>
      </div>
      
      {linkData && linkData.clinic && (
        <ClinicInformationCard clinicDetails={{
          name: linkData.clinic.name,
          email: linkData.clinic.email || '',
          phone: linkData.clinic.phone || '',
          address: linkData.clinic.address || ''
        }} />
      )}
    </PaymentLayout>
  );
};

export default PaymentFailedPage;
