
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFilteredPaymentLinks } from '@/hooks/useFilteredPaymentLinks';
import ReusableLinkFilters from '@/components/dashboard/links/ReusableLinkFilters';
import PaymentLinkTable from '@/components/dashboard/links/PaymentLinkTable';
import PaymentLinkDetailsDialog from '@/components/dashboard/links/PaymentLinkDetailsDialog';
import ArchiveConfirmDialog from '@/components/dashboard/links/ArchiveConfirmDialog';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Archive, ArchiveRestore, PlusCircle } from 'lucide-react';
import CreateLinkSheet from '@/components/dashboard/links/CreateLinkSheet';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

const ReusableLinksPage = () => {
  useDocumentTitle('Reusable Links');
  
  const {
    filteredLinks,
    isLoading,
    searchQuery,
    setSearchQuery,
    linkType,
    setLinkType,
    isArchiveView,
    setIsArchiveView,
    archivePaymentLink,
    unarchivePaymentLink,
    fetchPaymentLinks
  } = useFilteredPaymentLinks();

  const { createPaymentLink } = usePaymentLinks();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [linkToArchive, setLinkToArchive] = useState<PaymentLink | null>(null);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };
  
  const handleLinkClick = (link: PaymentLink) => {
    setSelectedLink(link);
    setDetailsDialogOpen(true);
  };

  const handleArchiveClick = (link: PaymentLink) => {
    setLinkToArchive(link);
    setArchiveDialogOpen(true);
  };
  
  const handleConfirmArchive = async () => {
    if (!linkToArchive) return;
    
    setIsArchiveLoading(true);
    try {
      if (isArchiveView) {
        await unarchivePaymentLink(linkToArchive.id);
      } else {
        await archivePaymentLink(linkToArchive.id);
      }
      
      await fetchPaymentLinks();
      toast.success(`Link ${isArchiveView ? 'unarchived' : 'archived'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${isArchiveView ? 'unarchive' : 'archive'} link`);
    } finally {
      setIsArchiveLoading(false);
      setArchiveDialogOpen(false);
      setLinkToArchive(null);
    }
  };

  const toggleArchiveView = () => {
    setIsArchiveView(!isArchiveView);
    setCurrentPage(1); // Reset to first page on view change
  };

  const handleCreateLinkClick = () => {
    setCreateSheetOpen(true);
  };

  const handleLinkCreated = () => {
    fetchPaymentLinks();
  };

  // Pagination
  const totalPages = Math.ceil(filteredLinks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLinks = filteredLinks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Reusable Payment Links" 
        description="Manage your reusable payment links that can be sent to patients"
        action={
          <div className="flex items-center gap-2">
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
            {!isArchiveView && (
              <Button className="btn-gradient" size="sm" onClick={handleCreateLinkClick}>
                <PlusCircle className="h-4 w-4 mr-1" />
                Create Payment
              </Button>
            )}
          </div>
        }
      />
      
      <Card className="card-shadow">
        <CardContent className="p-6">
          <ReusableLinkFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            linkType={linkType}
            onLinkTypeChange={setLinkType}
          />
          
          {isLoading ? (
            <div className="py-8 text-center">Loading payment links...</div>
          ) : (
            <>
              <PaymentLinkTable 
                links={paginatedLinks}
                onCopyLink={handleCopyLink}
                onLinkClick={handleLinkClick}
                onArchiveClick={handleArchiveClick}
                isArchiveView={isArchiveView}
              />
              
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }).map((_, index) => (
                        <PaginationItem key={index}>
                          <PaginationLink
                            isActive={currentPage === index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
          
          <PaymentLinkDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            paymentLink={selectedLink}
          />

          <ArchiveConfirmDialog
            open={archiveDialogOpen}
            onOpenChange={setArchiveDialogOpen}
            onConfirm={handleConfirmArchive}
            paymentLink={linkToArchive}
            isLoading={isArchiveLoading}
            isArchiveView={isArchiveView}
          />

          <CreateLinkSheet
            open={createSheetOpen}
            onOpenChange={setCreateSheetOpen}
            onLinkCreated={handleLinkCreated}
            createPaymentLink={createPaymentLink}
            defaultPaymentType="deposit"
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ReusableLinksPage;
