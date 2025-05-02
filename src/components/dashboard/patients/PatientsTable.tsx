
import React from 'react';
import PatientTableRow from './PatientTableRow';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Patient } from '@/hooks/usePatients';

interface PatientsTableProps {
  patients: Patient[];
  onPatientClick: (patient: Patient) => void;
}

const PatientsTable = ({ patients, onPatientClick }: PatientsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Payments</TableHead>
            <TableHead>Total Spent</TableHead>
            <TableHead>Last Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No patients found
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <PatientTableRow 
                key={patient.id}
                patient={patient}
                onClick={() => onPatientClick(patient)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PatientsTable;
