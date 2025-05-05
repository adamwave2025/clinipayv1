
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentLink } from '@/types/payment';
import { PaymentLinkService } from '@/services/PaymentLinkService';
import { formatPaymentLinks } from '@/utils/paymentLinkFormatter';
import { getUserClinicId } from '@/utils/userUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import ArchivePlanDialog from './ArchivePlanDialog';
import { formatCurrency } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlanTemplatesViewProps {
  onBackToPlans: () => void;
  refreshTrigger?: number; // Add optional refresh trigger
}

const PlanTemplatesView: React.FC<PlanTemplatesViewProps> = ({ onBackToPlans, refreshTrigger = 0 }) => {
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
  }, [isArchiveView, refreshTrigger]); // Add refreshTrigger to dependencies

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
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">
              Loading plan templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No {isArchiveView ? 'archived ' : ''}payment plan templates found.</p>
              {!isArchiveView && (
                <Button 
                  className="mt-4 btn-gradient"
                  onClick={() => toast.info('Create a new payment plan to save it as a template')}
                >
                  Create Plan Template
                </Button>
              )}
            </div>
          ) : (
            <Table>
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
              <TableBody>
                {templates.map(template => (
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
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
