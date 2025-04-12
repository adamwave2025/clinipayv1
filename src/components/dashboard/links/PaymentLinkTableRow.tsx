
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Archive } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { PaymentLink } from '@/types/payment';

interface PaymentLinkTableRowProps {
  link: PaymentLink;
  onCopyLink: (url: string) => void;
  onLinkClick: (link: PaymentLink) => void;
  onArchiveClick?: (link: PaymentLink) => void;
}

const PaymentLinkTableRow = ({ 
  link, 
  onCopyLink, 
  onLinkClick,
  onArchiveClick 
}: PaymentLinkTableRowProps) => {
  return (
    <TableRow 
      className="cursor-pointer hover:bg-gray-50 transition-colors" 
      onClick={() => onLinkClick(link)}
    >
      <TableCell>{link.title}</TableCell>
      <TableCell>{formatCurrency(link.amount)}</TableCell>
      <TableCell>
        <span className="capitalize">{link.type}</span>
      </TableCell>
      <TableCell>{link.createdAt}</TableCell>
      <TableCell className="text-right space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation();
            onCopyLink(link.url);
          }}
          aria-label="Copy link"
          className="h-8 w-8"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation();
            window.open(link.url, '_blank');
          }}
          aria-label="Open link"
          className="h-8 w-8"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        {onArchiveClick && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              onArchiveClick(link);
            }}
            aria-label="Archive link"
            className="h-8 w-8"
          >
            <Archive className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default PaymentLinkTableRow;
