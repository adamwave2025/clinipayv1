
import React from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { PaymentLink } from '@/types/payment';
import TemplateTableHeader from './TemplateTableHeader';
import TemplateRow from './TemplateRow';
import EmptyTemplateState from './EmptyTemplateState';

interface TemplateTableProps {
  templates: PaymentLink[];
  handleArchiveTemplate: (template: PaymentLink) => void;
  isArchiveView: boolean;
  isLoading: boolean;
}

const TemplateTable: React.FC<TemplateTableProps> = ({
  templates,
  handleArchiveTemplate,
  isArchiveView,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-500">
        Loading plan templates...
      </div>
    );
  }

  if (templates.length === 0) {
    return <EmptyTemplateState isArchiveView={isArchiveView} />;
  }

  return (
    <Table>
      <TemplateTableHeader />
      <TableBody>
        {templates.map(template => (
          <TemplateRow
            key={template.id}
            template={template}
            handleArchiveTemplate={handleArchiveTemplate}
            isArchiveView={isArchiveView}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default TemplateTable;
