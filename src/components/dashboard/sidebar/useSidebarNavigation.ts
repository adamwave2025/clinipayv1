
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarItem } from './navigationData';

export function useSidebarNavigation(items: SidebarItem[]) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();
  
  // Toggle submenu expansion
  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  // Check if a link is active with improved matching
  const isLinkActive = (to: string) => {
    // For exact matches (like '/dashboard'), require exact path match
    if (to === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    
    // For settings page with tab params, check the base route match
    if (to === '/dashboard/settings') {
      return location.pathname === '/dashboard/settings';
    }
    
    // For other routes, ensure proper path matching to avoid false positives
    // Use startsWith to prevent partial matches (e.g., /dashboard/settings matching /dashboard)
    // and add a trailing slash check to ensure complete path segments
    return location.pathname.startsWith(to) && 
      (location.pathname === to || 
       location.pathname.startsWith(to + '/') || 
       location.pathname.includes(to + '?'));
  };

  // Check if submenu has any active links
  const isSubmenuActive = (links: { to: string }[]) => {
    return links.some(link => isLinkActive(link.to));
  };
  
  // Initialize expanded menu based on active path
  useEffect(() => {
    // Find which submenu should be expanded initially based on current route
    items.forEach(item => {
      if ('links' in item) {
        if (isSubmenuActive(item.links) && expandedMenu !== item.label) {
          setExpandedMenu(item.label);
        }
      }
    });
    // Only run on mount to initialize the expanded state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    expandedMenu,
    toggleSubmenu,
    isLinkActive,
    isSubmenuActive
  };
}
