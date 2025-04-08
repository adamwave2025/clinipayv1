
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, X, Search, MoreVertical, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Clinic {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  joinDate: string;
  transactions: number;
}

const ClinicsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock clinic data
  const clinics: Clinic[] = [
    {
      id: '1',
      name: 'Greenfield Medical Clinic',
      email: 'contact@greenfieldclinic.com',
      status: 'active',
      joinDate: '2025-03-15',
      transactions: 28,
    },
    {
      id: '2',
      name: 'City Dental Practice',
      email: 'info@citydental.com',
      status: 'active',
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
      status: 'active',
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
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Suspended</Badge>;
      default:
        return null;
    }
  };

  const handleActivate = (clinicId: string) => {
    toast.success('Clinic activated successfully');
  };

  const handleSuspend = (clinicId: string) => {
    toast.success('Clinic suspended successfully');
  };

  const handleDelete = (clinicId: string) => {
    toast.success('Clinic deleted successfully');
  };

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title="Clinics" 
        description="Manage all registered clinics"
        action={
          <Button className="btn-gradient">
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
                  <th className="pb-3 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClinics.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      No clinics found
                    </td>
                  </tr>
                ) : (
                  filteredClinics.map((clinic) => (
                    <tr key={clinic.id} className="border-b hover:bg-gray-50">
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
                      <td className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {clinic.status === 'pending' && (
                              <DropdownMenuItem 
                                className="flex items-center gap-2"
                                onClick={() => handleActivate(clinic.id)}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {clinic.status === 'active' && (
                              <DropdownMenuItem 
                                className="flex items-center gap-2"
                                onClick={() => handleSuspend(clinic.id)}
                              >
                                <X className="h-4 w-4 text-red-500" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {clinic.status === 'suspended' && (
                              <DropdownMenuItem 
                                className="flex items-center gap-2"
                                onClick={() => handleActivate(clinic.id)}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-red-600"
                              onClick={() => handleDelete(clinic.id)}
                            >
                              <X className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
