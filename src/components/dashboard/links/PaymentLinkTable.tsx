
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PaymentLinkTableRow from './PaymentLinkTableRow';
import { PaymentLink } from '@/types/payment';

interface PaymentLinkTableProps {
  links: PaymentLink[];
  onCopyLink: (url: string) => void;
  onLinkClick: (link: PaymentLink) => void;
  onArchiveClick?: (link: PaymentLink) => void;
  isArchiveView?: boolean;
}

const PaymentLinkTable = ({ 
  links, 
  onCopyLink, 
  onLinkClick,
  onArchiveClick,
  isArchiveView = false
}: PaymentLinkTableProps) => {
  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>
          {isArchiveView 
            ? 'No archived payment links found.' 
            : 'No payment links created yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <PaymentLinkTableRow 
              key={link.id} 
              link={link} 
              onCopyLink={onCopyLink}
              onLinkClick={onLinkClick}
              onArchiveClick={onArchiveClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentLinkTable;
