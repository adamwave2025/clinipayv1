
import React from 'react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { TableRow, TableCell } from '@/components/ui/table';
import { Patient } from '@/hooks/usePatients';
import { Badge } from '@/components/ui/badge';

interface PatientTableRowProps {
  patient: Patient;
  onClick: () => void;
}

const PatientTableRow = ({ patient, onClick }: PatientTableRowProps) => {
  return (
    <TableRow 
      className="cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {patient.name}
          {patient.pendingRequestsCount ? (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
              {patient.pendingRequestsCount} pending
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        {patient.email || 'N/A'}
      </TableCell>
      <TableCell>
        {patient.phone || 'N/A'}
      </TableCell>
      <TableCell>
        {patient.paymentCount || 0}
      </TableCell>
      <TableCell>
        {formatCurrency(patient.totalSpent || 0)}
      </TableCell>
      <TableCell>
        {patient.lastPaymentDate ? formatDate(patient.lastPaymentDate) : 'N/A'}
      </TableCell>
    </TableRow>
  );
};

export default PatientTableRow;
