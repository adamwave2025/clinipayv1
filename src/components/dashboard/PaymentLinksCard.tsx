
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Archive, ArchiveRestore } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import PaymentLinkTable from './links/PaymentLinkTable';
import PaymentLinkDetailsDialog from './links/PaymentLinkDetailsDialog';
import ArchiveConfirmDialog from './links/ArchiveConfirmDialog';
import { PaymentLink } from '@/types/payment';

interface PaymentLinksCardProps {
  links: PaymentLink[];
  archivedLinks: PaymentLink[];
  isArchiveLoading: boolean;
  onArchiveLink: (linkId: string) => Promise<{ success: boolean; error?: string; }>;
  onUnarchiveLink: (linkId: string) => Promise<{ success: boolean; error?: string; }>;
}

const ITEMS_PER_PAGE = 3;

const PaymentLinksCard = ({
  links,
  archivedLinks,
  isArchiveLoading,
  onArchiveLink,
  onUnarchiveLink
}: PaymentLinksCardProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [linkToArchive, setLinkToArchive] = useState<PaymentLink | null>(null);
  const [isArchiveView, setIsArchiveView] = useState(false);

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
    
    if (isArchiveView) {
      await onUnarchiveLink(linkToArchive.id);
    } else {
      await onArchiveLink(linkToArchive.id);
    }
    
    setArchiveDialogOpen(false);
    setLinkToArchive(null);
  };

  const toggleArchiveView = () => {
    setIsArchiveView(!isArchiveView);
    setCurrentPage(1); // Reset to first page on view change
  };

  const displayLinks = isArchiveView ? archivedLinks : links;
  const totalPages = Math.ceil(displayLinks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLinks = displayLinks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  // Reset pagination when the number of items changes
  useEffect(() => {
    if (currentPage > 1 && startIndex >= displayLinks.length) {
      setCurrentPage(Math.max(1, Math.ceil(displayLinks.length / ITEMS_PER_PAGE)));
    }
  }, [displayLinks.length, currentPage, startIndex]);

  return (
    <Card className="card-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{isArchiveView ? 'Archived Reusable Payment Links' : 'Reusable Payment Links'}</CardTitle>
          <CardDescription>
            {isArchiveView 
              ? 'Your archived reusable payment links' 
              : 'Your recently created reusable payment links'}
          </CardDescription>
        </div>
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
            <Button className="btn-gradient" size="sm" asChild>
              <Link to="/dashboard/create-link">Create Payment</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default PaymentLinksCard;
