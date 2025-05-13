
import React, { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Debug setting - can be enabled via localStorage
const DEBUG_ADMIN_REDIRECT = localStorage.getItem('DEBUG_ADMIN_REDIRECT') === 'true' || false;

interface AdminRedirectProps {
  fallbackComponent: React.ReactNode;
}

const AdminRedirect: React.FC<AdminRedirectProps> = ({ fallbackComponent }) => {
  const { role, loading, initialFetchComplete, circuitBreakerActive } = useUserRole();
  const { debugMode } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [stableState, setStableState] = useState(false);
  
  // Track redirection state to prevent loops
  const redirectStateRef = useRef({
    redirectDecisionsCount: 0,
    lastDecisionTime: 0,
    isCircuitBreakerTripped: false,
    roleAtLastDecision: null as string | null
  });
  
  // Debug logging function
  const logRedirectEvent = (action: string, details?: any) => {
    if (DEBUG_ADMIN_REDIRECT || debugMode) {
      console.group(`🔄 Admin Redirect: ${action}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`Role: ${role || 'none'}`);
      console.log(`Loading: ${loading}`);
      console.log(`Circuit Breaker: ${circuitBreakerActive ? 'active' : 'inactive'}`);
      console.log(`Redirect State: ${shouldRedirect}`);
      if (details) console.log('Details:', details);
      console.groupEnd();
    }
  };
  
  useEffect(() => {
    // After role is loaded, determine if we should redirect
    if (!loading && initialFetchComplete) {
      logRedirectEvent('Role loaded, evaluating redirect', {
        role,
        redirectCount: redirectStateRef.current.redirectDecisionsCount
      });
      
      // Only make a decision if circuit breaker is not tripped
      if (redirectStateRef.current.isCircuitBreakerTripped) {
        logRedirectEvent('Skipping redirect evaluation - circuit breaker tripped');
        return;
      }
      
      // Check for potential redirection loops
      const now = Date.now();
      const redirectData = redirectStateRef.current;
      redirectData.redirectDecisionsCount++;
      
      // If making too many redirect decisions in short succession
      if (
        redirectData.redirectDecisionsCount > 3 && 
        (now - redirectData.lastDecisionTime) < 5000 && 
        role === redirectData.roleAtLastDecision
      ) {
        // Circuit breaker to prevent loops
        redirectData.isCircuitBreakerTripped = true;
        
        logRedirectEvent('🚨 CIRCUIT BREAKER TRIPPED - Potential redirect loop', {
          decisions: redirectData.redirectDecisionsCount,
          timespan: now - redirectData.lastDecisionTime + 'ms',
          consistentRole: role === redirectData.roleAtLastDecision
        });
        
        // Force stable state and use current displayed component
        setStableState(true);
        setShouldRedirect(false);
        
        // Reset circuit breaker after delay
        setTimeout(() => {
          redirectData.isCircuitBreakerTripped = false;
          redirectData.redirectDecisionsCount = 0;
          logRedirectEvent('Circuit breaker reset');
        }, 10000); // 10 second cool-down
        
        return;
      }
      
      // Update redirect state tracking
      redirectData.lastDecisionTime = now;
      redirectData.roleAtLastDecision = role;
      
      if (role === 'admin') {
        logRedirectEvent('User has admin role, setting redirect');
        setShouldRedirect(true);
      } else {
        logRedirectEvent('User does not have admin role, rendering fallback');
        setShouldRedirect(false);
      }
      
      setStableState(true);
    }
  }, [role, loading, initialFetchComplete, debugMode, circuitBreakerActive]);
  
  // Add debug logging
  logRedirectEvent('Component state', {
    role,
    loading,
    initialFetchComplete,
    shouldRedirect,
    stableState,
    circuitBreakerActive
  });
  
  if (loading || !initialFetchComplete || !stableState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (shouldRedirect) {
    logRedirectEvent('Redirecting to admin dashboard');
    return <Navigate to="/admin" replace />;
  }
  
  logRedirectEvent('Rendering fallback component');
  return <>{fallbackComponent}</>;
};

export default AdminRedirect;
