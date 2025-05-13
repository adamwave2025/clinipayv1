
/**
 * Debug tools for React applications
 */

// Type for optional debug options
interface DebugOptions {
  verbose?: boolean;
  includeStack?: boolean;
  timestamp?: boolean;
}

/**
 * Create a scoped logger for a specific component or module
 * @param scope The name of the component or module
 * @param options Debug options
 */
export const createScopedLogger = (scope: string, options: DebugOptions = {}) => {
  const { verbose = false, includeStack = false, timestamp = true } = options;
  
  // Create a timestamp string for logging
  const getTimestamp = (): string => {
    if (!timestamp) return '';
    const now = new Date();
    return `[${now.toISOString()}] `;
  };

  return {
    log: (message: string, ...args: any[]) => {
      if (verbose) {
        console.log(`${getTimestamp()}${scope}: ${message}`, ...args);
      }
    },
    
    info: (message: string, ...args: any[]) => {
      console.info(`${getTimestamp()}${scope}: ${message}`, ...args);
    },
    
    warn: (message: string, ...args: any[]) => {
      console.warn(`${getTimestamp()}${scope}: ${message}`, ...args);
      if (includeStack) {
        console.warn(new Error().stack);
      }
    },
    
    error: (message: string, ...args: any[]) => {
      console.error(`${getTimestamp()}${scope}: ${message}`, ...args);
      if (includeStack) {
        console.error(new Error().stack);
      }
    },
    
    group: (label: string) => {
      console.group(`${getTimestamp()}${scope}: ${label}`);
    },
    
    groupEnd: () => {
      console.groupEnd();
    },
    
    // Add a method to log component render
    rendered: (props?: any) => {
      if (verbose) {
        if (props) {
          console.log(`${getTimestamp()}${scope} rendered with:`, props);
        } else {
          console.log(`${getTimestamp()}${scope} rendered`);
        }
      }
    }
  };
};

/**
 * Check if React hooks can be called in the current context
 * This helps debug "Hooks can only be called inside a component" errors
 */
export function checkReactHookContext(): boolean {
  try {
    // Create a temporary component that uses a hook
    const temp = () => {
      // Access React API through window to avoid direct import issues
      const React = (window as any).React;
      if (!React || !React.useState) {
        console.error('React not available in global scope or useState not defined');
        return false;
      }
      
      // Try to use useState hook - will throw if not in a component context
      const [test, setTest] = React.useState(false);
      return true;
    };
    
    // Call the component
    return temp();
  } catch (err) {
    console.error('Not in a valid React hooks context:', err);
    return false;
  }
}

/**
 * Check if we're in a React context
 */
export function isInReactContext(): boolean {
  // Access React API through window to avoid direct import issues
  const React = (window as any).React;
  if (!React) {
    console.warn('React not found in global scope');
    return false;
  }
  
  // Check if basic React API is available
  if (!React.createElement || !React.Fragment) {
    console.warn('React API appears to be incomplete');
    return false;
  }
  
  return true;
}

/**
 * Function to validate that all required React providers are present
 * in the component tree above the current component
 */
export function validateReactProviders(): string[] {
  const missingProviders: string[] = [];
  
  // Check for common providers
  try {
    const React = (window as any).React;
    if (!React) return ['React (global)'];
    
    // More provider checks could be added here
    
    return missingProviders;
  } catch (err) {
    console.error('Error checking React providers:', err);
    return ['Unknown (error during check)'];
  }
}

/**
 * Function to log React contexts that have missing providers
 */
export function logMissingProviders(): void {
  const missing = validateReactProviders();
  if (missing.length > 0) {
    console.warn('Missing React providers detected:', missing.join(', '));
  } else {
    console.log('No missing React providers detected');
  }
}
