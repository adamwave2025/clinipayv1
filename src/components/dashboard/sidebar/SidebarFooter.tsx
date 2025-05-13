
import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SidebarFooter: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in');
  };
  
  return (
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
  );
};

export default SidebarFooter;
