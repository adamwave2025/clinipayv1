
import React from 'react';
import { Payment } from '@/types/payment';
import { formatCurrency } from '@/utils/formatters';
import StatusBadge from '../../common/StatusBadge';

interface PatientDetailsSectionProps {
  payment: Payment;
}

const PatientDetailsSection = ({ payment }: PatientDetailsSectionProps) => {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <div className="col-span-2 sm:col-span-1">
        <h4 className="text-sm font-medium text-gray-500">Patient</h4>
        <p className="mt-1 font-medium truncate">{payment.patientName}</p>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <h4 className="text-sm font-medium text-gray-500">Amount</h4>
        <p className="mt-1 font-medium">{formatCurrency(payment.amount)}</p>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <h4 className="text-sm font-medium text-gray-500">Email</h4>
        <p className="mt-1 truncate">{payment.patientEmail || 'Not provided'}</p>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <h4 className="text-sm font-medium text-gray-500">Phone</h4>
        <p className="mt-1 truncate">{payment.patientPhone || 'Not provided'}</p>
      </div>
      <div className="col-span-1">
        <h4 className="text-sm font-medium text-gray-500">Date</h4>
        <p className="mt-1">{payment.date}</p>
      </div>
      <div className="col-span-1">
        <h4 className="text-sm font-medium text-gray-500">Status</h4>
        <StatusBadge status={payment.status} className="mt-1" />
      </div>
    </div>
  );
};

export default PatientDetailsSection;
