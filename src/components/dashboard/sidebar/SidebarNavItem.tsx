
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
  
  // Special handling for settings page - For settings links, we always
  // use the basic path and let SettingsContainer handle tab selection
  // This prevents the URL parameter loop issue
  let to: string | { pathname: string; search: string } = item.to;
  
  // When we're already on the settings page and have a tab parameter,
  // preserve it only if we're clicking on settings again
  if (item.to === '/dashboard/settings' && location.pathname === '/dashboard/settings') {
    console.log('📝 Settings link clicked while on settings page');
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
