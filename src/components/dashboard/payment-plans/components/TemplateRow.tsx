
import React from 'react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { PaymentLink } from '@/types/payment';
import { formatCurrency } from '@/utils/formatters';

interface TemplateRowProps {
  template: PaymentLink;
  handleArchiveTemplate: (template: PaymentLink) => void;
  isArchiveView: boolean;
}

const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  handleArchiveTemplate,
  isArchiveView
}) => {
  return (
    <TableRow key={template.id}>
      <TableCell className="font-medium">{template.title}</TableCell>
      <TableCell>{template.description || '-'}</TableCell>
      <TableCell>{formatCurrency(template.planTotalAmount || 0)}</TableCell>
      <TableCell>{template.paymentCount || '-'}</TableCell>
      <TableCell>{template.paymentCycle || '-'}</TableCell>
      <TableCell>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleArchiveTemplate(template)}
        >
          {isArchiveView ? 'Restore' : 'Archive'}
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default TemplateRow;
