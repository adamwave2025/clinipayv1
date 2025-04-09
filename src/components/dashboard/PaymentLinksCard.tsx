
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import PaymentLinkTable from './links/PaymentLinkTable';

export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  type: string;
  url: string;
  createdAt: string;
}

interface PaymentLinksCardProps {
  links: PaymentLink[];
}

const ITEMS_PER_PAGE = 3;

const PaymentLinksCard = ({ links }: PaymentLinksCardProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };
  
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLinks = links.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <Card className="card-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment Links</CardTitle>
          <CardDescription>Your recently created payment links</CardDescription>
        </div>
        <Button className="btn-gradient" size="sm" asChild>
          <Link to="/dashboard/create-link">Create New</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <PaymentLinkTable 
          links={paginatedLinks}
          onCopyLink={handleCopyLink}
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
      </CardContent>
    </Card>
  );
};

export default PaymentLinksCard;
