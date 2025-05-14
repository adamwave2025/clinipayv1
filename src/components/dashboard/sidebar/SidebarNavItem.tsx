import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SidebarLink } from './navigationData';

interface SidebarNavItemProps {
  item: SidebarLink;
  isActive: (to: string) => boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ item, isActive }) => {
  const location = useLocation();
  
  // Determine if current link is active using the passed isActive function
  const linkIsActive = isActive(item.to);
  
  // Special handling for settings page
  // Initialize with the default string path
  let to: string | { pathname: string; search: string } = item.to;
  
  // Special case: We're on settings page already AND clicking on settings again
  // Only in this case we want to preserve the tab parameter
  if (
    item.to === '/dashboard/settings' && 
    location.pathname === '/dashboard/settings' &&
    location.search && 
    location.search.includes('tab=')
  ) {
    console.log('📌 Settings link clicked while on settings page with tab param');
    // Keep the existing search parameters
    to = { pathname: item.to, search: location.search };
  }

  return (
    <NavLink
      to={to}
      className={`
        flex items-center px-4 py-3 rounded-lg text-gray-700 transition-colors
        ${linkIsActive 
          ? 'bg-gradient-primary text-white' 
          : 'hover:bg-gray-100'
        }
      `}
      // Use 'end' prop only for index routes like /dashboard
      end={item.to === '/dashboard'}
    >
      {item.icon}
      <span className="ml-3">{item.label}</span>
    </NavLink>
  );
};

export default SidebarNavItem;
