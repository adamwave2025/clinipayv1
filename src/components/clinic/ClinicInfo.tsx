
import React from 'react';
import { Mail, Phone, MapPin, CreditCard, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ClinicInfoProps {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  stripeStatus: string;
  joinDate: string;
  logo: string;
}

const ClinicInfo = ({ 
  name, 
  contactName, 
  email, 
  phone, 
  address, 
  stripeStatus, 
  joinDate, 
  logo 
}: ClinicInfoProps) => {
  const getStripeStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Connected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'not_connected':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Not Connected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Not Connected</Badge>;
    }
  };

  return (
    <div>
      <div className="flex items-center mb-5">
        <Avatar className="h-16 w-16 mr-4">
          <AvatarFallback className="bg-gradient-primary text-white text-xl">
            {logo}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-gray-500">{contactName}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p>{email}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Phone className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500">Phone</p>
            <p>{phone}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p>{address}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500">Stripe Connect</p>
            <div className="mt-1">{getStripeStatusBadge(stripeStatus)}</div>
          </div>
        </div>
        
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500">Date Joined</p>
            <p>{new Date(joinDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicInfo;
