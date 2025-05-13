
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

// Debug setting - can be enabled via localStorage
const DEBUG_CONNECTIVITY = localStorage.getItem('DEBUG_CONNECTIVITY') === 'true' || false;

interface ConnectivityMonitorProps {
  children: React.ReactNode;
}

const ConnectivityMonitor: React.FC<ConnectivityMonitorProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasNotified, setHasNotified] = useState(false);
  
  // Track connectivity state with more details
  const connectivityRef = useRef({
    lastOnlineTime: navigator.onLine ? Date.now() : 0,
    lastOfflineTime: navigator.onLine ? 0 : Date.now(),
    offlineCount: 0,
    onlineCount: 0,
    lastConnectionQuality: 'unknown' as 'unknown' | 'good' | 'poor' | 'unstable',
    unstableConnectionDetected: false
  });
  
  // Debug logging function
  const logConnectivity = (event: string, details?: any) => {
    if (DEBUG_CONNECTIVITY) {
      console.group(`🌐 Connectivity: ${event}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`Online: ${navigator.onLine}`);
      if (details) console.log('Details:', details);
      console.groupEnd();
    }
  };
  
  // Connection quality check
  const checkConnectionQuality = useCallback(() => {
    const connData = connectivityRef.current;
    const now = Date.now();
    
    // Check for unstable connection (frequent on/off changes)
    if (connData.offlineCount > 3 && connData.onlineCount > 3 && 
        (now - Math.min(connData.lastOnlineTime, connData.lastOfflineTime) < 60000)) {
      
      connData.lastConnectionQuality = 'unstable';
      connData.unstableConnectionDetected = true;
      
      logConnectivity('Unstable connection detected', {
        onlineCount: connData.onlineCount,
        offlineCount: connData.offlineCount,
        timePeriod: Math.floor((now - Math.min(connData.lastOnlineTime, connData.lastOfflineTime)) / 1000) + 's'
      });
      
      // Only notify once about unstable connection
      if (!connData.unstableConnectionDetected) {
        toast.warning('Your internet connection appears unstable. This may affect application performance.', {
          duration: 8000,
        });
      }
      
      return 'unstable';
    }
    
    return navigator.onLine ? 'good' : 'poor';
  }, []);
  
  const checkConnection = useCallback(() => {
    const nowOnline = navigator.onLine;
    const wasOnline = isOnline;
    const connData = connectivityRef.current;
    const now = Date.now();
    
    // Update stats
    if (nowOnline) {
      connData.lastOnlineTime = now;
      connData.onlineCount++;
    } else {
      connData.lastOfflineTime = now;
      connData.offlineCount++;
    }
    
    logConnectivity('Connection check', {
      nowOnline,
      wasOnline,
      onlineCount: connData.onlineCount,
      offlineCount: connData.offlineCount
    });
    
    // Check connection quality
    checkConnectionQuality();
    
    // State transition from offline to online
    if (nowOnline && !wasOnline) {
      logConnectivity('Connection restored');
      toast.success('Internet connection restored');
      setHasNotified(false);
      
      // Force refresh data
      window.dispatchEvent(new CustomEvent('connectivity:restored', {
        detail: {
          timeOffline: now - connData.lastOfflineTime,
          quality: checkConnectionQuality()
        }
      }));
    } 
    // State transition from online to offline
    else if (!nowOnline && wasOnline) {
      logConnectivity('Connection lost');
      
      if (!hasNotified) {
        toast.error('Internet connection lost. Some features may be limited.', {
          duration: 10000, // Longer duration for important message
        });
        setHasNotified(true);
      }
      
      // Notify app components
      window.dispatchEvent(new CustomEvent('connectivity:lost', {
        detail: {
          lastOnlineTime: connData.lastOnlineTime,
          offlineDuration: now - connData.lastOnlineTime
        }
      }));
    }
    
    setIsOnline(nowOnline);
  }, [isOnline, hasNotified, checkConnectionQuality]);
  
  // Perform network quality tests
  const testConnectionQuality = useCallback(async () => {
    try {
      // Simple fetch to check real connectivity (browser onLine can be misleading)
      const start = Date.now();
      const response = await fetch('https://www.gstatic.com/generate_204', {
        mode: 'no-cors',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const end = Date.now();
      const latency = end - start;
      
      logConnectivity('Network quality test', { 
        status: 'success', 
        latency: latency + 'ms',
        responseSize: response ? 'received' : 'failed'
      });
      
      // Update online state if we're actually online but browser doesn't know it
      if (!navigator.onLine && latency < 5000) {
        logConnectivity('Correcting browser online status', { 
          browserReports: 'offline', 
          actuallyOnline: true
        });
        
        // Force an online status update
        window.dispatchEvent(new Event('online'));
      }
      
      return latency;
    } catch (error) {
      logConnectivity('Network quality test failed', { error });
      
      // Update offline state if we're actually offline but browser doesn't know it
      if (navigator.onLine) {
        logConnectivity('Correcting browser online status', { 
          browserReports: 'online', 
          actuallyOnline: false
        });
        
        // Force an offline status update
        window.dispatchEvent(new Event('offline'));
      }
      
      return -1;
    }
  }, []);
  
  useEffect(() => {
    // Check connection status immediately
    checkConnection();
    
    // Run an actual network test in the background
    testConnectionQuality().then(latency => {
      logConnectivity('Initial connection quality', { 
        latency: latency + 'ms',
        isOnline: navigator.onLine
      });
    });
    
    // Add event listeners for browser connectivity events
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    // Additional periodic checks to catch edge cases
    const intervalId = setInterval(() => {
      checkConnection();
    }, 30000);
    
    // Deeper network quality checks
    const qualityCheckId = setInterval(() => {
      testConnectionQuality().then(latency => {
        // Only log if we actually get a result
        if (latency !== -1) {
          logConnectivity('Periodic connection quality check', { 
            latency: latency + 'ms',
            quality: latency < 200 ? 'good' : latency < 1000 ? 'fair' : 'poor'
          });
        }
      });
    }, 120000); // every 2 minutes
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      clearInterval(intervalId);
      clearInterval(qualityCheckId);
    };
  }, [checkConnection, testConnectionQuality]);
  
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
