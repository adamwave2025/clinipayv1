
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { capitalizeFirstLetter, formatCurrency } from '@/utils/formatters';
import { PaymentLink } from '@/types/payment';

interface PaymentLinkTableRowProps {
  link: PaymentLink;
  onCopyLink: (url: string) => void;
}

const PaymentLinkTableRow = ({ link, onCopyLink }: PaymentLinkTableRowProps) => {
  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="py-4 pl-2 pr-3">
        <div className="font-medium text-gray-900">{link.title}</div>
      </td>
      <td className="py-4 px-3 font-medium">
        {formatCurrency(link.amount)}
      </td>
      <td className="py-4 px-3 text-gray-700">
        {capitalizeFirstLetter(link.type)}
      </td>
      <td className="py-4 px-3 text-gray-500">
        {link.createdAt}
      </td>
      <td className="py-4 px-3">
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onCopyLink(link.url)}
            className="h-8 w-8"
            aria-label="Copy link"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            aria-label="Preview link"
            asChild
          >
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default PaymentLinkTableRow;
