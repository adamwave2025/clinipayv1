
import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import {
  SidebarHeader,
  SidebarNavigation,
  SidebarFooter,
  getClinicItems,
  getAdminLinks
} from './sidebar';

interface DashboardSidebarProps {
  userType: 'clinic' | 'admin';
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ userType, isOpen, onClose }: DashboardSidebarProps) => {
  const { role } = useUserRole();
  
  // Use the actual user role for navigation items if available
  const actualUserType = role === 'admin' ? 'admin' : 'clinic';
  const effectiveUserType = userType || actualUserType;
  
  // Get the appropriate navigation items based on user type
  const navigationItems = effectiveUserType === 'clinic' ? getClinicItems() : getAdminLinks();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <SidebarHeader onClose={onClose} />
          <SidebarNavigation items={navigationItems} />
          <SidebarFooter />
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
