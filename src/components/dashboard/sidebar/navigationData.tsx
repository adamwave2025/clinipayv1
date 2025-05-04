
import { Home, Link as LinkIcon, Send, Settings, Users, Clock, CreditCard, Calendar, HelpCircle } from 'lucide-react';
import React from 'react';

export interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export interface SidebarSubmenu {
  label: string;
  icon: React.ReactNode;
  links: SidebarLink[];
}

export type SidebarItem = SidebarLink | SidebarSubmenu;

export const getClinicItems = (): SidebarItem[] => [
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
        to: '/dashboard/manage-plans',
        label: 'Payment Plans',
        icon: <Calendar className="w-5 h-5" />
      },
      {
        to: '/dashboard/payment-history',
        label: 'Payment History',
        icon: <Clock className="w-5 h-5" />
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
  { 
    to: '/dashboard/help', 
    label: 'Help', 
    icon: <HelpCircle className="w-5 h-5" /> 
  },
];

export const getAdminLinks = (): SidebarLink[] => [
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
