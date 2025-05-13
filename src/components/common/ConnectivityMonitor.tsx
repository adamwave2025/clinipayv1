
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ConnectivityMonitorProps {
  children: React.ReactNode;
}

/**
 * Component to monitor network connectivity and show alerts when connection status changes
 */
const ConnectivityMonitor: React.FC<ConnectivityMonitorProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  
  // Track network state changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success('Your internet connection has been restored');
        console.log('🌐 Network connection restored', new Date().toISOString());
      }
      setWasOffline(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error('You are currently offline. Some features may be limited.');
      console.log('🌐 Network connection lost', new Date().toISOString());
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check at startup if we're really online by pinging a resource
    const checkRealConnectivity = async () => {
      try {
        // Simple HEAD request to check connectivity
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        if (!response.ok) {
          console.warn('🌐 Network check failed - endpoint returned error');
          if (navigator.onLine) {
            console.warn('🌐 Browser reports online but network check failed');
          }
        }
      } catch (e) {
        console.warn('🌐 Network connectivity check failed', e);
        if (navigator.onLine) {
          // Browser thinks we're online but fetch failed
          setWasOffline(true);
          console.log('🌐 Browser reports online but network request failed');
        }
      }
    };
    
    checkRealConnectivity();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);
  
  return (
    <>
      {!isOnline && (
        <div className="bg-yellow-100 text-yellow-800 text-sm py-1 px-2 text-center">
          You are currently offline. Some features may be unavailable.
        </div>
      )}
      {children}
    </>
  );
};

export default ConnectivityMonitor;
