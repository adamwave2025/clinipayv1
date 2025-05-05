
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';
import { PaymentLinkService } from '@/services/PaymentLinkService';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';
import { getUserClinicId } from '@/utils/userUtils';
import { Card } from '@/components/ui/card';
import ArchivePlanDialog from './ArchivePlanDialog';
import TemplateHeader from './components/TemplateHeader';
import TemplateContent from './components/TemplateContent';

interface PlanTemplatesViewProps {
  onBackToPlans: () => void;
  refreshTrigger?: number;
}

const PlanTemplatesView: React.FC<PlanTemplatesViewProps> = ({ 
  onBackToPlans, 
  refreshTrigger = 0 
}) => {
  const [templates, setTemplates] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiveView, setIsArchiveView] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [planToArchive, setPlanToArchive] = useState<PaymentLink | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Load template data directly from the payment_links table
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // Get the clinic ID
      const clinicId = await getUserClinicId();
      
      if (!clinicId) {
        console.error('Could not determine clinic ID');
        toast.error('Failed to load templates - clinic ID not found');
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching payment plan templates for clinic ID: ${clinicId}, archived: ${isArchiveView}`);
      
      // Fetch payment links
      const { activeLinks, archivedLinks } = await PaymentLinkService.fetchLinks(clinicId);
      
      // Use archived or active links based on the view setting
      const linksToUse = isArchiveView ? archivedLinks : activeLinks;
      
      // Filter to only include payment plans and format them
      const formattedTemplates = formatPaymentLinks(linksToUse).filter(link => {
        // Debug log each link to help troubleshoot
        console.log(`Link ${link.id}: type=${link.type}, paymentPlan=${link.paymentPlan}, title=${link.title}`);
        
        // Only include links that are payment plans
        return link.paymentPlan === true;
      });
      
      console.log(`Found ${formattedTemplates.length} payment plan templates`);
      setTemplates(formattedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load plan templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and when archive view changes or refresh is triggered
  useEffect(() => {
    fetchTemplates();
  }, [isArchiveView, refreshTrigger]);

  // Toggle between archived and active templates
  const toggleArchiveView = () => {
    setIsArchiveView(prev => !prev);
  };

  // Handle archiving a template
  const handleArchiveTemplate = (template: PaymentLink) => {
    setPlanToArchive(template);
    setShowArchiveDialog(true);
  };

  // Confirm archive action
  const confirmArchiveAction = async () => {
    if (!planToArchive) return;
    
    setIsArchiving(true);
    try {
      if (isArchiveView) {
        // Unarchive
        const { success } = await PaymentLinkService.unarchiveLink(planToArchive.id);
        if (success) {
          toast.success(`Plan template "${planToArchive.title}" restored successfully`);
          await fetchTemplates();
        } else {
          toast.error('Failed to restore plan template');
        }
      } else {
        // Archive
        const { success } = await PaymentLinkService.archiveLink(planToArchive.id);
        if (success) {
          toast.success(`Plan template "${planToArchive.title}" archived successfully`);
          await fetchTemplates();
        } else {
          toast.error('Failed to archive plan template');
        }
      }
    } catch (error) {
      console.error('Error with archive/unarchive:', error);
      toast.error('An error occurred');
    } finally {
      setIsArchiving(false);
      setShowArchiveDialog(false);
      setPlanToArchive(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Content */}
      <Card className="shadow-sm">
        <TemplateHeader 
          isArchiveView={isArchiveView} 
          toggleArchiveView={toggleArchiveView} 
        />
        <TemplateContent 
          templates={templates}
          isLoading={isLoading}
          isArchiveView={isArchiveView}
          handleArchiveTemplate={handleArchiveTemplate}
        />
      </Card>

      {/* Archive Confirmation Dialog */}
      <ArchivePlanDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        onConfirm={confirmArchiveAction}
        plan={planToArchive}
        isLoading={isArchiving}
        isUnarchive={isArchiveView}
      />
    </div>
  );
};

export default PlanTemplatesView;
