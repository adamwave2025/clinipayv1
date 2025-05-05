import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import { Mail, Phone } from 'lucide-react';
import PaymentPlanBreakdown from './PaymentPlanBreakdown';

interface PaymentPageClinicCardProps {
  clinic: {
    name: string;
    logo: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentType: string;
    amount: number;
  };
  paymentPlan?: boolean;
  planTotalAmount?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  isOverdue?: boolean;
  paymentLinkId?: string;
}

const PaymentPageClinicCard: React.FC<PaymentPageClinicCardProps> = ({
  clinic,
  paymentPlan = false,
  planTotalAmount = 0,
  totalPaid = 0,
  totalOutstanding = 0,
  isOverdue = false,
  paymentLinkId
}) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Clinic Logo and Name */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full overflow-hidden w-16 h-16 border border-gray-200">
            <img
              src={clinic.logo}
              alt={`${clinic.name} Logo`}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{clinic.name}</h1>
          </div>
        </div>
        
        {/* Payment information */}
        <div className="mt-6">
          <h2 className="text-lg font-medium">{clinic.paymentType}</h2>
          
          {paymentPlan ? (
            <PaymentPlanBreakdown
              planTotalAmount={planTotalAmount}
              totalPaid={totalPaid}
              totalOutstanding={totalOutstanding}
              isOverdue={isOverdue}
              paymentLinkId={paymentLinkId}
            />
          ) : (
            <div className="mt-3 text-2xl font-bold">
              {formatCurrency(clinic.amount)}
            </div>
          )}
        </div>
        
        {/* Clinic Contact Information */}
        <div className="mt-6 space-y-2">
          <h3 className="text-md font-medium">Contact Us</h3>
          {clinic.email && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{clinic.email}</span>
            </div>
          )}
          {clinic.phone && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{clinic.phone}</span>
            </div>
          )}
          {clinic.address && (
            <div className="text-gray-600">
              <span>{clinic.address}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentPageClinicCard;
