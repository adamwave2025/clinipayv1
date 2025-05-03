
import React from 'react';
import { NavLink } from 'react-router-dom';
import { SidebarLink } from './navigationData';

interface SidebarNavItemProps {
  item: SidebarLink;
  isActive: (to: string) => boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ item, isActive }) => {
  return (
    <li>
      <NavLink
        to={item.to}
        className={({ isActive }) => `
          flex items-center px-4 py-3 rounded-lg text-gray-700 transition-colors
          ${isActive 
            ? 'bg-gradient-primary text-white' 
            : 'hover:bg-gray-100'
          }
        `}
        end
      >
        {item.icon}
        <span className="ml-3">{item.label}</span>
      </NavLink>
    </li>
  );
};

export default SidebarNavItem;
