
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TemplateTableHeader: React.FC = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Template Name</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Installments</TableHead>
        <TableHead>Frequency</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TemplateTableHeader;
