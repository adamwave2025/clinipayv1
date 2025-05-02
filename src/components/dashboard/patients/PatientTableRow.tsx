
import React from 'react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { TableRow, TableCell } from '@/components/ui/table';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentCount: number;
  totalSpent: number;
  lastPaymentDate: string;
}

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
        {patient.email}
      </TableCell>
      <TableCell>
        {patient.phone || 'N/A'}
      </TableCell>
      <TableCell>
        {patient.paymentCount}
      </TableCell>
      <TableCell>
        {formatCurrency(patient.totalSpent)}
      </TableCell>
      <TableCell>
        {patient.lastPaymentDate}
      </TableCell>
    </TableRow>
  );
};

export default PatientTableRow;
