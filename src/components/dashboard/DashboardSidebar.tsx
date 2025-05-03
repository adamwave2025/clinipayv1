
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Link as LinkIcon, 
  Send, 
  Settings, 
  Users, 
  LogOut, 
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '../common/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarSubmenu {
  label: string;
  icon: React.ReactNode;
  links: SidebarLink[];
}

type SidebarItem = SidebarLink | SidebarSubmenu;

interface DashboardSidebarProps {
  userType: 'clinic' | 'admin';
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ userType, isOpen, onClose }: DashboardSidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useUserRole();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null); // Changed from "Payments" to null
  
  // Use the actual user role for link determination if available
  const actualUserType = role === 'admin' ? 'admin' : 'clinic';
  const effectiveUserType = userType || actualUserType;
  
  const clinicItems: SidebarItem[] = [
    { 
      to: '/dashboard', 
      label: 'Dashboard', 
      icon: <Home className="w-5 h-5" /> 
    },
    { 
      label: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      links: [
        {
          to: '/dashboard/create-link',
          label: 'Create Payment',
          icon: <LinkIcon className="w-5 h-5" />
        },
        {
          to: '/dashboard/send-link',
          label: 'Request Payment',
          icon: <Send className="w-5 h-5" />
        },
        {
          to: '/dashboard/payment-history',
          label: 'Payment History',
          icon: <Clock className="w-5 h-5" />
        },
        {
          to: '/dashboard/manage-plans',
          label: 'Manage Plans',
          icon: <Calendar className="w-5 h-5" />
        }
      ]
    },
    { 
      to: '/dashboard/patients', 
      label: 'Patients', 
      icon: <Users className="w-5 h-5" /> 
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

  const items = effectiveUserType === 'clinic' ? clinicItems : adminLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in');
  };

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const isLinkActive = (to: string) => {
    return location.pathname === to;
  };

  const isSubmenuActive = (links: SidebarLink[]) => {
    return links.some(link => isLinkActive(link.to));
  };

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
              {items.map((item, index) => (
                <li key={`sidebar-item-${index}`}>
                  {'to' in item ? (
                    // Regular link item
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
                  ) : (
                    // Submenu item
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleSubmenu(item.label)}
                        className={`
                          flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-700 transition-colors
                          ${isSubmenuActive(item.links) || expandedMenu === item.label
                            ? 'bg-gray-100'
                            : 'hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-center">
                          {item.icon}
                          <span className="ml-3">{item.label}</span>
                        </div>
                        {expandedMenu === item.label ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      {expandedMenu === item.label && (
                        <ul className="pl-10 space-y-1">
                          {item.links.map((link, linkIndex) => (
                            <li key={`submenu-link-${linkIndex}`}>
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
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
