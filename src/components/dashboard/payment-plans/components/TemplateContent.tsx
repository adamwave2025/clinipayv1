
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { PaymentLink } from '@/types/payment';
import TemplateTable from './TemplateTable';

interface TemplateContentProps {
  templates: PaymentLink[];
  isLoading: boolean;
  isArchiveView: boolean;
  handleArchiveTemplate: (template: PaymentLink) => void;
}

const TemplateContent: React.FC<TemplateContentProps> = ({
  templates,
  isLoading,
  isArchiveView,
  handleArchiveTemplate
}) => {
  return (
    <CardContent>
      <TemplateTable
        templates={templates}
        handleArchiveTemplate={handleArchiveTemplate}
        isArchiveView={isArchiveView}
        isLoading={isLoading}
      />
    </CardContent>
  );
};

export default TemplateContent;
