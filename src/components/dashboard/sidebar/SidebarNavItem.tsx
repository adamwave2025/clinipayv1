
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
  
  // For settings page, we want to preserve the URL parameters when navigating
  const to = item.to === '/dashboard/settings' && location.pathname === '/dashboard/settings' 
    ? { pathname: item.to, search: location.search }
    : item.to;

  return (
    <li>
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
    </li>
  );
};

export default SidebarNavItem;
