
import * as React from 'react';
import { useEffect, useState } from 'react';

/**
 * Hook to safely use tooltip components with proper error handling
 * This helps avoid the "Can't read properties of null (reading 'useState')" error
 */
export function useTooltipSafety() {
  const [isTooltipSafe, setIsTooltipSafe] = useState(true);
  
  useEffect(() => {
    // Check if we're in a valid React environment
    const checkReact = () => {
      if (typeof window === 'undefined') return false;
      const React = (window as any).React;
      if (!React) return false;
      if (typeof React.useState !== 'function') return false;
      return true;
    };
    
    const isReactValid = checkReact();
    setIsTooltipSafe(isReactValid);
    
    if (!isReactValid) {
      console.warn(
        'React not properly initialized for tooltips. ' +
        'If you see "Cannot read properties of null (reading useState)" errors, ' +
        'make sure TooltipProvider is used properly.'
      );
    }
  }, []);
  
  return { isTooltipSafe };
}

/**
 * HOC to safely render tooltip components
 * @param Component The component to wrap
 */
export function withTooltipSafety<P extends object>(Component: React.ComponentType<P>) {
  return function SafeTooltipComponent(props: P) {
    const { isTooltipSafe } = useTooltipSafety();
    
    if (!isTooltipSafe) {
      return null;
    }
    
    return <Component {...props} />;
  };
}
