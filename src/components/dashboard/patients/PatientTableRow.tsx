
import React from 'react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { TableRow, TableCell } from '@/components/ui/table';
import { Patient } from '@/hooks/usePatients';

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
        {patient.name}
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
