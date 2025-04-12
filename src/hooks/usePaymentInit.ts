
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentLinkData } from './usePaymentLinkData';
import { toast } from 'sonner';

export function usePaymentInit(linkId: string | undefined, errorParam: string | null) {
  const [initError, setInitError] = useState<string | null>(errorParam);
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);
  const navigate = useNavigate();

  // Redirect if link not found
  useEffect(() => {
    if (!isLoading && (error || !linkData)) {
      console.error("Payment link error:", error);
      navigate('/payment/failed');
    }
  }, [isLoading, error, linkData, navigate]);
  
  // Handle global errors by redirecting to failed page
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("Unhandled payment error:", event.error);
      toast.error("An unexpected error occurred");
      
      // Prevent redirect loops by checking if we're already on the failed page
      if (!window.location.pathname.includes('/payment/failed')) {
        navigate(`/payment/failed${linkId ? `?link_id=${linkId}` : ''}`);
      }
      
      // Prevent the default handler
      event.preventDefault();
    };
    
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, [navigate, linkId]);

  return {
    linkData,
    isLoading,
    initError,
    setInitError
  };
}
