
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface PaymentPageClinicCardProps {
  clinic: {
    name: string;
    logo: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentType: string;
    amount: number; // Amount in pence/cents
  };
  paymentPlan?: boolean;
  planTotalAmount?: number; // Amount in pence/cents
  totalPaid?: number; // Amount in pence/cents
  totalOutstanding?: number; // Amount in pence/cents
  isOverdue?: boolean;
  paymentLinkId?: string;
}

const PaymentPageClinicCard = ({
  clinic,
  paymentPlan,
  planTotalAmount,
  totalPaid,
  totalOutstanding,
  isOverdue,
  paymentLinkId
}: PaymentPageClinicCardProps) => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <div className="flex items-center">
          {clinic.logo ? (
            <img 
              src={clinic.logo} 
              alt={clinic.name}  
              className="h-12 w-12 rounded-full mr-3 object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold mr-3">
              {clinic.name.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="font-bold text-lg">{clinic.name}</h2>
            <p className="text-sm text-gray-600">{clinic.paymentType}</p>
          </div>
        </div>
        
        {/* Payment Amount Display */}
        <div className="mt-4 bg-gray-50 p-3 rounded-md">
          {paymentPlan ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Total Plan Amount:</span>
                <span className="font-bold">{formatCurrency(planTotalAmount || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Amount Paid:</span>
                <span>{formatCurrency(totalPaid || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Amount Outstanding:</span>
                <span className="font-bold">{formatCurrency(totalOutstanding || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Current Installment:</span>
                <span className="font-bold">{formatCurrency(clinic.amount)}</span>
              </div>
              
              {isOverdue && (
                <div className="mt-2 flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">This payment is overdue</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Amount Due:</span>
              <span className="font-bold text-xl">{formatCurrency(clinic.amount)}</span>
            </div>
          )}
        </div>
        
        {/* Clinic Contact Information */}
        <div className="mt-4 space-y-2 text-sm">
          {clinic.email && (
            <p className="text-gray-600">
              Email: <span className="font-medium">{clinic.email}</span>
            </p>
          )}
          {clinic.phone && (
            <p className="text-gray-600">
              Phone: <span className="font-medium">{clinic.phone}</span>
            </p>
          )}
          {clinic.address && (
            <p className="text-gray-600">
              Address: <span className="font-medium">{clinic.address}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentPageClinicCard;
