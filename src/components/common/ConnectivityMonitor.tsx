
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectivityMonitorProps {
  children: React.ReactNode;
}

const ConnectivityMonitor: React.FC<ConnectivityMonitorProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasNotified, setHasNotified] = useState(false);
  
  const checkConnection = useCallback(() => {
    const nowOnline = navigator.onLine;
    
    // State transition from offline to online
    if (nowOnline && !isOnline) {
      console.log('Connection restored');
      toast.success('Internet connection restored');
      setHasNotified(false);
      
      // Force refresh data
      window.dispatchEvent(new CustomEvent('connectivity:restored'));
    } 
    // State transition from online to offline
    else if (!nowOnline && isOnline) {
      console.log('Connection lost');
      
      if (!hasNotified) {
        toast.error('Internet connection lost. Some features may be limited.', {
          duration: 10000, // Longer duration for important message
        });
        setHasNotified(true);
      }
      
      // Notify app components
      window.dispatchEvent(new CustomEvent('connectivity:lost'));
    }
    
    setIsOnline(nowOnline);
  }, [isOnline, hasNotified]);
  
  useEffect(() => {
    // Check connection status immediately
    checkConnection();
    
    // Add event listeners for browser connectivity events
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    // Additional periodic checks to catch edge cases
    const intervalId = setInterval(() => {
      checkConnection();
    }, 30000);
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      clearInterval(intervalId);
    };
  }, [checkConnection]);
  
  return (
    <>
      {!isOnline && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg z-50">
          <WifiOff className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium">Offline Mode</span>
        </div>
      )}
      {children}
    </>
  );
};

export default ConnectivityMonitor;
