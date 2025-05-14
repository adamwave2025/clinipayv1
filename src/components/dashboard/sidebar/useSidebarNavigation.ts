
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

  // Check if a link is active with enhanced matching for settings page
  const isLinkActive = (to: string) => {
    // Extract the base URL without search params
    const currentPath = location.pathname;
    
    // Special case for dashboard root
    if (to === '/dashboard') {
      return currentPath === '/dashboard';
    }
    
    // Special handling for settings page
    if (to === '/dashboard/settings') {
      // Always match if we're on the settings path, regardless of the tab
      return currentPath === '/dashboard/settings';
    }
    
    // For other routes, use exact match or prefix match for nested routes
    return currentPath === to || 
           (currentPath !== '/dashboard' && to !== '/dashboard' && currentPath.startsWith(to));
  };

  // Check if submenu has any active links
  const isSubmenuActive = (links: { to: string }[]) => {
    return links.some(link => isLinkActive(link.to));
  };
  
  // Initialize expanded menu based on active path
  useEffect(() => {
    // Skip if pathname hasn't changed
    if (prevPathname.current === location.pathname) {
      return;
    }
    
    // Update previous pathname
    prevPathname.current = location.pathname;
    
    // Find which submenu should be expanded based on current route
    const menuToExpand = items
      .filter((item): item is Extract<SidebarItem, { label: string, links: Array<{ to: string }> }> => 
        'links' in item && Array.isArray(item.links))
      .find(item => isSubmenuActive(item.links))?.label;
      
    if (menuToExpand && expandedMenu !== menuToExpand) {
      setExpandedMenu(menuToExpand);
    }
  }, [location.pathname, items, expandedMenu]);

  return {
    expandedMenu,
    toggleSubmenu,
    isLinkActive,
    isSubmenuActive
  };
}
