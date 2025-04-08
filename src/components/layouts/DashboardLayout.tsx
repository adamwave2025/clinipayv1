
import React, { useState } from 'react';
import DashboardSidebar from '../dashboard/DashboardSidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '../common/Logo';
import { Link } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'clinic' | 'admin';
}

const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm">
        <Link to="/" className="flex items-center">
          <Logo className="h-8 w-auto" />
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Sidebar */}
      <DashboardSidebar 
        userType={userType} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main content */}
      <main className="flex-1">
        <div className="container py-6 px-4 md:py-8 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
