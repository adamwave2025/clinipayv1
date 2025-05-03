
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/common/Logo';

interface SidebarHeaderProps {
  onClose: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onClose }) => {
  return (
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
  );
};

export default SidebarHeader;
