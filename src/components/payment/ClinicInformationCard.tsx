
import React from 'react';
import { Building, Mail, Phone, MapPin } from 'lucide-react';

interface ClinicDetails {
  name: string;
  logo?: string; // Add logo as optional property
  email: string;
  phone: string;
  address: string;
}

interface ClinicInformationCardProps {
  clinicDetails: ClinicDetails;
  className?: string;
}

const ClinicInformationCard = ({ clinicDetails, className = '' }: ClinicInformationCardProps) => {
  return (
    <div className={`mt-8 bg-white rounded-lg p-4 border border-gray-100 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Clinic Information</h3>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Building className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-gray-700 font-medium">{clinicDetails.name}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="text-gray-700">{clinicDetails.address}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-700">{clinicDetails.email}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="text-gray-700">{clinicDetails.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicInformationCard;
