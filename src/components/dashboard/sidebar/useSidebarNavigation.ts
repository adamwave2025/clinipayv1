
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarItem } from './navigationData';

export function useSidebarNavigation(items: SidebarItem[]) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();
  
  // Previous pathname for comparison
  const prevPathname = useRef(location.pathname);
  
  // Toggle submenu expansion
  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  // Check if a link is active with enhanced matching for query parameters
  const isLinkActive = (to: string) => {
    // Extract the base URL without search params
    const currentPath = location.pathname;
    
    // Special case for dashboard root
    if (to === '/dashboard') {
      return currentPath === '/dashboard';
    }
    
    // Special case for settings page with tab params
    if (to === '/dashboard/settings') {
      return currentPath === '/dashboard/settings';
    }
    
    // For other routes, use a more precise matching algorithm
    // that prevents partial matches and handles path segments properly
    if (to !== '/dashboard' && currentPath.startsWith(to)) {
      // Make sure it's a complete path segment match
      // This prevents "/dashboard" from matching "/dashboard/settings"
      const toWithSlash = to.endsWith('/') ? to : `${to}/`;
      return currentPath === to || 
             currentPath.startsWith(toWithSlash) ||
             // Allow query parameter matches
             currentPath === to.split('?')[0];
    }
    
    return false;
  };

  // Check if submenu has any active links
  const isSubmenuActive = (links: { to: string }[]) => {
    return links.some(link => isLinkActive(link.to));
  };
  
  // Initialize expanded menu based on active path
  useEffect(() => {
    // Track pathname changes for debugging
    if (prevPathname.current !== location.pathname) {
      prevPathname.current = location.pathname;
    }
    
    // Find which submenu should be expanded based on current route
    const menuToExpand = items
      .filter((item): item is Extract<SidebarItem, { label: string, links: Array<{ to: string }> }> => 
        'links' in item && Array.isArray(item.links))
      .find(item => isSubmenuActive(item.links))?.label;
      
    if (menuToExpand && expandedMenu !== menuToExpand) {
      setExpandedMenu(menuToExpand);
    }
    // Only run when the pathname changes
  }, [location.pathname, items]);

  return {
    expandedMenu,
    toggleSubmenu,
    isLinkActive,
    isSubmenuActive
  };
}
