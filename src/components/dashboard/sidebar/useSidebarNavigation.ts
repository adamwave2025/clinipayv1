
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

  // Check if a link is active
  const isLinkActive = (to: string) => {
    // For main dashboard route, only return true for exact match
    if (to === '/dashboard' && location.pathname !== '/dashboard') {
      return false;
    }
    // For other routes, check if the location pathname includes the to path
    return location.pathname.includes(to);
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
