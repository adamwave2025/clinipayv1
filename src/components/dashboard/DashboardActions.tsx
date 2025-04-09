
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const DashboardActions = () => {
  return (
    <Button className="btn-gradient" asChild>
      <Link to="/dashboard/create-link">
        <Plus className="mr-2 h-4 w-4" />
        Create Link
      </Link>
    </Button>
  );
};

export default DashboardActions;
