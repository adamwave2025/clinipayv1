
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
import LinkFormFields from '../links/LinkFormFields';
import { useCreateLinkForm, LinkFormData } from '@/hooks/useCreateLinkForm';
import CreatePlanConfirmDialog from '../links/CreatePlanConfirmDialog';
import { PaymentLink } from '@/types/payment';

interface CreatePlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createPaymentLink: (data: any) => Promise<{ success: boolean, paymentLink?: PaymentLink, error?: string }>;
}

const CreatePlanSheet: React.FC<CreatePlanSheetProps> = ({
  open,
  onOpenChange,
  createPaymentLink
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingFormData, setPendingFormData] = React.useState<LinkFormData | null>(null);
  
  // Reset state when the dialog opens or closes
  React.useEffect(() => {
    if (!open) {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    }
  }, [open]);
  
  // Handle successful plan creation
  const handleLinkGenerated = () => {
    setIsLoading(false);
    onOpenChange(false); // Close the sheet
    toast.success('Payment plan created successfully');
  };
  
  // Show confirmation dialog before creating the plan
  const handleConfirmPlan = (formData: LinkFormData) => {
    setPendingFormData(formData);
    setShowConfirmDialog(true);
  };
  
  // Create the plan after confirmation
  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);
    
    if (!pendingFormData) return;
    
    try {
      const { paymentTitle, amount, description, paymentCount, paymentCycle } = pendingFormData;
      
      // Validate required fields
      if (!paymentTitle || !amount || !paymentCount || !paymentCycle) {
        toast.error('Missing required plan information');
        setIsLoading(false);
        return;
      }

      // Parse amount as float first to handle proper decimal values
      const amountValue = parseFloat(amount);
      
      // We store amounts in cents in the database, so multiply by 100
      const amountInCents = Math.round(amountValue * 100);
      const paymentCountNum = Number(paymentCount);
      
      // Using snake_case keys for database compatibility
      const planData = {
        title: paymentTitle,
        amount: amountInCents,
        description,
        type: 'payment_plan',
        payment_plan: true, // Explicitly set to true
        payment_count: paymentCountNum,
        payment_cycle: paymentCycle,
        // Calculate and store the total amount
        plan_total_amount: Math.round(amountValue * 100 * paymentCountNum)
      };
      
      console.log('Sending plan data to create payment link:', planData);
      
      const result = await createPaymentLink(planData);
      
      if (result.success) {
        handleLinkGenerated();
      } else {
        toast.error(result.error || 'Failed to create payment plan');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating payment plan:', error);
      toast.error('An error occurred while creating the payment plan');
      setIsLoading(false);
    }
  };
  
  const { formData, handleChange, handleSelectChange, handleSubmit } = useCreateLinkForm({
    onLinkGenerated: handleLinkGenerated,
    onSubmit: handleConfirmPlan,
    isLoading,
    defaultPaymentType: 'payment_plan'
  });
  
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[90%] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Create Payment Plan</SheetTitle>
            <SheetDescription>
              Create a payment plan that allows patients to pay in installments.
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <LinkFormFields 
              formData={formData}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
              isLoading={isLoading}
              showPaymentTypeSelect={false}
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
                Create Payment Plan
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      
      {pendingFormData && (
        <CreatePlanConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          formData={pendingFormData}
          onConfirm={handleConfirmSubmit}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default CreatePlanSheet;
