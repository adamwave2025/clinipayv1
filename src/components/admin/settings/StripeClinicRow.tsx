
import React from 'react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreditCard } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { StripeClinicRowProps } from '@/types/admin';

const StripeClinicRow = ({ clinic, onDisconnect }: StripeClinicRowProps) => {
  return (
    <TableRow key={clinic.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-primary text-white text-xs">
              {clinic.clinic_name?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{clinic.clinic_name || 'Unnamed Clinic'}</p>
            <p className="text-xs text-gray-500">{clinic.email || 'No email'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={clinic.stripe_status as any || 'not_connected'} />
      </TableCell>
      <TableCell className="text-right">
        {clinic.stripe_status === 'connected' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
            onClick={() => onDisconnect(clinic.id)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default StripeClinicRow;
