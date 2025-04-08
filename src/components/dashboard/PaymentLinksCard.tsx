
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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

const PaymentLinksCard = ({ links }: PaymentLinksCardProps) => {
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

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
                  <tr 
                    key={link.id} 
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 pl-2 pr-3">
                      <div className="font-medium text-gray-900">{link.title}</div>
                    </td>
                    <td className="py-4 px-3 font-medium">
                      £{link.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-3 text-gray-700">
                      {link.type}
                    </td>
                    <td className="py-4 px-3 text-gray-500">
                      {link.createdAt}
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleCopyLink(link.url)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentLinksCard;
