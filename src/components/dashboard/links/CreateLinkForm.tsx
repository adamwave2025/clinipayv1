
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LinkFormFields from './LinkFormFields';
import { useCreateLinkForm, LinkFormData } from '@/hooks/useCreateLinkForm';
import { PaymentLink } from '@/types/payment';

export type { LinkFormData };

interface CreateLinkFormProps {
  onLinkGenerated: (link: string, formData: LinkFormData) => void;
  isLoading: boolean;
  onCreateLink?: (data: Omit<PaymentLink, 'id' | 'url' | 'createdAt' | 'isActive'>) => Promise<{ success: boolean, paymentLink?: PaymentLink, error?: string }>;
  onSubmit?: (formData: LinkFormData) => void;
}

const CreateLinkForm = ({ onLinkGenerated, isLoading, onCreateLink, onSubmit }: CreateLinkFormProps) => {
  const { formData, handleChange, handleSelectChange, handleSubmit } = useCreateLinkForm({
    onLinkGenerated, 
    onCreateLink, 
    onSubmit, 
    isLoading
  });

  return (
    <Card className="card-shadow max-w-2xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <LinkFormFields 
            formData={formData}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
            isLoading={isLoading}
          />
          
          <Button 
            type="submit" 
            className="w-full btn-gradient"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            {formData.paymentPlan ? 'Create Payment Plan' : 'Generate Payment Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateLinkForm;
