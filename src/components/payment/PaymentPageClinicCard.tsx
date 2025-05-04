
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PaymentPlanBreakdown from './PaymentPlanBreakdown';

interface ClinicInfo {
  name: string;
  logo: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentType: string;
  amount: number;
}

interface PaymentPageClinicCardProps {
  clinic: ClinicInfo;
  paymentPlan?: boolean;
  planTotalAmount?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  isOverdue?: boolean;
}

const PaymentPageClinicCard = ({ 
  clinic, 
  paymentPlan, 
  planTotalAmount, 
  totalPaid, 
  totalOutstanding,
  isOverdue
}: PaymentPageClinicCardProps) => {
  // Generate initials for the avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="border-none shadow-none bg-white rounded-lg mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16 border">
            {clinic.logo ? (
              <AvatarImage src={clinic.logo} alt={clinic.name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials(clinic.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{clinic.name}</h2>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          {clinic.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-500 font-medium">Address</p>
                <p className="text-gray-700">{clinic.address}</p>
              </div>
            </div>
          )}
          
          {clinic.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-500 font-medium">Email</p>
                <p className="text-gray-700">{clinic.email}</p>
              </div>
            </div>
          )}
          
          {clinic.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-500 font-medium">Phone</p>
                <p className="text-gray-700">{clinic.phone}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-500 font-medium">Payment Type</p>
              <p className="text-gray-700">{clinic.paymentType}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            {paymentPlan && planTotalAmount && totalPaid !== undefined && totalOutstanding !== undefined && (
              <PaymentPlanBreakdown
                planTotalAmount={planTotalAmount}
                totalPaid={totalPaid}
                totalOutstanding={totalOutstanding}
                isOverdue={isOverdue}
              />
            )}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">Amount Due:</span>
              <span className="text-xl font-bold text-primary">£{clinic.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentPageClinicCard;
