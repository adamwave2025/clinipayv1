
import React from 'react';
import { toast } from 'sonner';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LinkFormFields from './LinkFormFields';
import { useCreateLinkForm, LinkFormData } from '@/hooks/useCreateLinkForm';
import LinkGeneratedDialog from './LinkGeneratedDialog';
import { PaymentLink } from '@/types/payment';

interface CreateLinkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkCreated?: () => void;
  createPaymentLink: (data: Omit<PaymentLink, 'id' | 'url' | 'createdAt' | 'isActive'>) => Promise<{ success: boolean, paymentLink?: PaymentLink, error?: string }>;
  defaultPaymentType?: string;
}

const CreateLinkSheet: React.FC<CreateLinkSheetProps> = ({
  open,
  onOpenChange,
  onLinkCreated,
  createPaymentLink,
  defaultPaymentType = 'deposit'
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedLink, setGeneratedLink] = React.useState('');
  const [showLinkDialog, setShowLinkDialog] = React.useState(false);
  const [linkFormData, setLinkFormData] = React.useState<LinkFormData | null>(null);
  
  // Reset state when the sheet closes, but not when link is generated
  React.useEffect(() => {
    if (!open && !showLinkDialog) {
      setIsLoading(false);
      setGeneratedLink('');
    }
  }, [open, showLinkDialog]);
  
  const handleLinkGenerated = (link: string, formData: LinkFormData) => {
    setGeneratedLink(link);
    setLinkFormData(formData);
    setIsLoading(false);
    setShowLinkDialog(true);
    onOpenChange(false); // Close the sheet
    
    if (onLinkCreated) {
      onLinkCreated();
    }
  };
  
  const { formData, handleChange, handleSelectChange, handleSubmit } = useCreateLinkForm({
    onLinkGenerated: handleLinkGenerated,
    onCreateLink: createPaymentLink,
    isLoading,
    defaultPaymentType
  });
  
  const onFormSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    await handleSubmit(e);
    // Don't reset isLoading here, let the handleLinkGenerated function do it
  };
  
  const isPlanMode = formData.paymentPlan;
  
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[90%] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Create Reusable Payment Link</SheetTitle>
            <SheetDescription>
              Create a payment link that you can reuse multiple times.
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={onFormSubmit} className="space-y-6">
            <LinkFormFields 
              formData={formData}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
              isLoading={isLoading}
              showPaymentTypeSelect={true}
              hidePlanOption={true}
            />
            
            <div className="flex justify-end gap-3 pt-4">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button 
                type="submit" 
                className="btn-gradient"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Generate Reusable Link
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      
      <LinkGeneratedDialog 
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        generatedLink={generatedLink}
        formData={linkFormData}
      />
    </>
  );
};

export default CreateLinkSheet;
