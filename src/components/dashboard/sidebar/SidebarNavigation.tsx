
import React from 'react';
import { SidebarItem } from './navigationData';
import SidebarNavItem from './SidebarNavItem';
import SidebarSubmenu from './SidebarSubmenu';
import { useSidebarNavigation } from './useSidebarNavigation';

interface SidebarNavigationProps {
  items: SidebarItem[];
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ items }) => {
  const { expandedMenu, toggleSubmenu, isLinkActive, isSubmenuActive } = useSidebarNavigation(items);
  
  return (
    <nav className="flex-1 p-4">
      <ul className="space-y-1">
        {items.map((item, index) => (
          'to' in item ? (
            <li key={`sidebar-item-${index}`}>
              <SidebarNavItem 
                item={item} 
                isActive={isLinkActive} 
              />
            </li>
          ) : (
            <li key={`sidebar-item-${index}`}>
              <SidebarSubmenu 
                item={item} 
                isExpanded={expandedMenu === item.label} 
                onToggle={() => toggleSubmenu(item.label)}
                isLinkActive={isLinkActive}
                isSubmenuActive={isSubmenuActive(item.links)}
              />
            </li>
          )
        ))}
      </ul>
    </nav>
  );
};

export default SidebarNavigation;
