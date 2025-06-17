
/**
 * Utility functions for route detection and management
 */

/**
 * Checks if the current pathname is a payment-related route
 * @param pathname - The current route pathname
 * @returns true if the route is payment-related, false otherwise
 */
export const isPaymentRoute = (pathname: string): boolean => {
  // Check for exact payment routes
  if (pathname === '/payment' || 
      pathname === '/payment/success' || 
      pathname === '/payment/failed') {
    return true;
  }
  
  // Check for dynamic payment routes (e.g., /payment/abc-123)
  if (pathname.startsWith('/payment/')) {
    return true;
  }
  
  return false;
};
