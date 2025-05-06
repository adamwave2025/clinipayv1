
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
    <Card className="w-full overflow-hidden border shadow-md">
      {/* Clinic Header with Logo and Name */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
        <div className="flex items-center space-x-4">
          <div className="rounded-full overflow-hidden w-16 h-16 border border-gray-200 bg-white flex items-center justify-center shadow-sm">
            <img
              src={clinic.logo}
              alt={`${clinic.name} Logo`}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold">{clinic.name}</h1>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-6">
        {/* Payment information */}
        <div>
          <h2 className="text-gray-600 font-medium mb-2">
            {clinic.paymentType}
          </h2>
          
          {/* Amount Due Section - Highlighted */}
          <div className="bg-gray-50 rounded-lg p-4 border mb-4">
            <h3 className="text-sm text-gray-600 uppercase font-medium mb-1">Amount Due</h3>
            <div className="text-2xl font-bold text-[#9b87f5]">
              {paymentPlan ? (
                formatCurrency(clinic.amount)
              ) : (
                formatCurrency(clinic.amount)
              )}
            </div>
          </div>
          
          {/* Payment Plan Details (if applicable) */}
          {paymentPlan && (
            <PaymentPlanBreakdown
              planTotalAmount={planTotalAmount}
              totalPaid={totalPaid}
              totalOutstanding={totalOutstanding}
              isOverdue={isOverdue}
              paymentLinkId={paymentLinkId}
            />
          )}
        </div>
        
        {/* Clinic Contact Information */}
        <div className="pt-4 border-t">
          <h3 className="text-sm text-gray-600 uppercase font-medium mb-3">Contact Information</h3>
          <div className="space-y-2">
            {clinic.email && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${clinic.email}`} className="hover:text-[#9b87f5] transition-colors">
                  {clinic.email}
                </a>
              </div>
            )}
            {clinic.phone && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <a href={`tel:${clinic.phone}`} className="hover:text-[#9b87f5] transition-colors">
                  {clinic.phone}
                </a>
              </div>
            )}
            {clinic.address && (
              <div className="text-gray-600 pl-6">
                <span>{clinic.address}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentPageClinicCard;
