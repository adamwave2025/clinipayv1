
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentLinkData } from './usePaymentLinkData';
import { toast } from 'sonner';

export function usePaymentInit(linkId: string | undefined, errorParam: string | null) {
  const [initError, setInitError] = useState<string | null>(errorParam);
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);
  const navigate = useNavigate();

  // Redirect if link not found, but only after loading is complete
  useEffect(() => {
    // Only redirect if we're done loading AND have an error
    if (!isLoading && (error || !linkData)) {
      console.error("Payment link error:", error);
      console.log("Payment link data:", linkData);
      
      // Add a slight delay to avoid immediate redirects
      // This gives components time to mount and check for data
      const redirectTimer = setTimeout(() => {
        if (!linkData) {
          console.log("Redirecting to failed page due to missing payment link data");
          navigate('/payment/failed');
        }
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
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
