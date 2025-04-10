
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

interface Clinic {
  id: string;
  name: string;
  email: string;
  status: 'connected' | 'pending' | 'suspended';
  joinDate: string;
  transactions: number;
}

const ClinicsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  // Mock clinic data
  const clinics: Clinic[] = [
    {
      id: '1',
      name: 'Greenfield Medical Clinic',
      email: 'contact@greenfieldclinic.com',
      status: 'connected',
      joinDate: '2025-03-15',
      transactions: 28,
    },
    {
      id: '2',
      name: 'City Dental Practice',
      email: 'info@citydental.com',
      status: 'connected',
      joinDate: '2025-02-22',
      transactions: 42,
    },
    {
      id: '3',
      name: 'Metro Physiotherapy',
      email: 'admin@metrophysio.com',
      status: 'pending',
      joinDate: '2025-04-05',
      transactions: 0,
    },
    {
      id: '4',
      name: 'Wellness Hub',
      email: 'info@wellnesshub.com',
      status: 'connected',
      joinDate: '2025-01-10',
      transactions: 65,
    },
    {
      id: '5',
      name: 'Riverdale Hospital',
      email: 'contact@riverdalehospital.com',
      status: 'suspended',
      joinDate: '2025-02-08',
      transactions: 12,
    },
  ];

  const filteredClinics = clinics.filter(clinic => 
    clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Connected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Suspended</Badge>;
      default:
        return null;
    }
  };

  const handleAddClinic = () => {
    toast.success('New clinic form opened');
    // Add implementation for adding a new clinic
  };

  const handleClinicClick = (clinicId: string) => {
    navigate(`/admin/clinics/${clinicId}`);
  };

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title="Clinics" 
        description="Manage all registered clinics"
        action={
          <Button className="btn-gradient" onClick={handleAddClinic}>
            Add New Clinic
          </Button>
        }
      />
      
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clinics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input-focus"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-gray-500">Clinic</th>
                  <th className="pb-3 font-medium text-gray-500">Status</th>
                  <th className="pb-3 font-medium text-gray-500">Join Date</th>
                  <th className="pb-3 font-medium text-gray-500">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClinics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No clinics found
                    </td>
                  </tr>
                ) : (
                  filteredClinics.map((clinic) => (
                    <tr 
                      key={clinic.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer" 
                      onClick={() => handleClinicClick(clinic.id)}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gradient-primary text-white">
                              {clinic.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{clinic.name}</p>
                            <p className="text-sm text-gray-500">{clinic.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(clinic.status)}
                      </td>
                      <td className="py-4 text-gray-500">
                        {new Date(clinic.joinDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-gray-500">
                        {clinic.transactions}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ClinicsPage;
