
import React from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface TemplateHeaderProps {
  isArchiveView: boolean;
  toggleArchiveView: () => void;
}

const TemplateHeader: React.FC<TemplateHeaderProps> = ({
  isArchiveView,
  toggleArchiveView
}) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>
        {isArchiveView ? 'Archived Plan Templates' : 'Payment Plan Templates'}
      </CardTitle>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={toggleArchiveView}
        className="gap-1"
      >
        {isArchiveView ? (
          <>
            <ArchiveRestore className="h-4 w-4" />
            <span className="hidden sm:inline">View Active</span>
          </>
        ) : (
          <>
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">View Archive</span>
          </>
        )}
      </Button>
    </CardHeader>
  );
};

export default TemplateHeader;
