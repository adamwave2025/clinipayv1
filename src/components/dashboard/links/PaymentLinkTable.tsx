
import React from 'react';
import PaymentLinkTableRow from './PaymentLinkTableRow';
import { Link } from 'react-router-dom';
import { PaymentLink } from '../PaymentLinksCard';

interface PaymentLinkTableProps {
  links: PaymentLink[];
  onCopyLink: (url: string) => void;
}

const PaymentLinkTable = ({ links, onCopyLink }: PaymentLinkTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="text-left text-sm text-gray-500">
          <tr className="border-b">
            <th className="pb-3 pl-2 pr-3 font-medium">Title</th>
            <th className="pb-3 px-3 font-medium">Amount</th>
            <th className="pb-3 px-3 font-medium">Type</th>
            <th className="pb-3 px-3 font-medium">Created</th>
            <th className="pb-3 px-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {links.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 text-center text-gray-500">
                No payment links found. <Link to="/dashboard/create-link" className="text-primary hover:underline">Create one now</Link>
              </td>
            </tr>
          ) : (
            links.map((link) => (
              <PaymentLinkTableRow 
                key={link.id}
                link={link} 
                onCopyLink={onCopyLink}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentLinkTable;
