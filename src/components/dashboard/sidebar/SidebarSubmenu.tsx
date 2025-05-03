
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SidebarSubmenu as SidebarSubmenuType } from './navigationData';

interface SidebarSubmenuProps {
  item: SidebarSubmenuType;
  isExpanded: boolean;
  onToggle: () => void;
  isLinkActive: (to: string) => boolean;
  isSubmenuActive: boolean;
}

const SidebarSubmenu: React.FC<SidebarSubmenuProps> = ({ 
  item, 
  isExpanded, 
  onToggle, 
  isLinkActive,
  isSubmenuActive 
}) => {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={`
          flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-700 transition-colors
          ${isSubmenuActive || isExpanded
            ? 'bg-gray-100'
            : 'hover:bg-gray-100'
          }
        `}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center">
          {item.icon}
          <span className="ml-3">{item.label}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {isExpanded && (
        <ul className="pl-10 space-y-1" role="menu" aria-label={`${item.label} submenu`}>
          {item.links.map((link, linkIndex) => (
            <li key={`submenu-link-${linkIndex}`} role="menuitem">
              <NavLink
                to={link.to}
                className={({ isActive }) => `
                  flex items-center px-2 py-2 rounded-lg text-gray-700 transition-colors
                  ${isActive 
                    ? 'bg-gradient-primary text-white' 
                    : 'hover:bg-gray-100'
                  }
                `}
                end
              >
                {link.icon}
                <span className="ml-2 truncate">{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SidebarSubmenu;
