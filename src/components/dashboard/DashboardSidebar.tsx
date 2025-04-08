
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Link as LinkIcon, 
  Send, 
  Settings, 
  Users, 
  LogOut, 
  X,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '../common/Logo';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  userType: 'clinic' | 'admin';
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ userType, isOpen, onClose }: DashboardSidebarProps) => {
  const clinicLinks: SidebarLink[] = [
    { 
      to: '/dashboard', 
      label: 'Dashboard', 
      icon: <Home className="w-5 h-5" /> 
    },
    { 
      to: '/dashboard/create-link', 
      label: 'Create a Link', 
      icon: <LinkIcon className="w-5 h-5" /> 
    },
    { 
      to: '/dashboard/send-link', 
      label: 'Send a Link', 
      icon: <Send className="w-5 h-5" /> 
    },
    { 
      to: '/dashboard/payment-history', 
      label: 'Payment History', 
      icon: <Clock className="w-5 h-5" /> 
    },
    { 
      to: '/dashboard/settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5" /> 
    },
  ];

  const adminLinks: SidebarLink[] = [
    { 
      to: '/admin', 
      label: 'Dashboard', 
      icon: <Home className="w-5 h-5" /> 
    },
    { 
      to: '/admin/clinics', 
      label: 'Clinics', 
      icon: <Users className="w-5 h-5" /> 
    },
    {
      to: '/admin/settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5" /> 
    },
  ];

  const links = userType === 'clinic' ? clinicLinks : adminLinks;
  const baseUrl = userType === 'clinic' ? '/dashboard' : '/admin';

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
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <Logo className="h-8 w-auto" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="md:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3 rounded-lg text-gray-700 transition-colors
                      ${isActive 
                        ? 'bg-gradient-primary text-white' 
                        : 'hover:bg-gray-100'
                      }
                    `}
                    end
                  >
                    {link.icon}
                    <span className="ml-3">{link.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
              asChild
            >
              <NavLink to="/logout">
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </NavLink>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
