
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Clinic {
  id: string;
  clinic_name: string | null;
  email: string | null;
  stripe_status: string | null;
  created_at: string | null;
  logo_url: string | null;
  transactions: number;
}

const ClinicsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchClinics();
  }, []);
  
  const fetchClinics = async () => {
    setIsLoading(true);
    try {
      // Get all clinics
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('id, clinic_name, email, stripe_status, created_at, logo_url')
        .order('created_at', { ascending: false });
      
      if (clinicsError) throw clinicsError;
      
      // Get transactions count for each clinic
      const clinicsWithTransactions = await Promise.all(
        (clinicsData || []).map(async (clinic) => {
          const { count, error: countError } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinic.id);
          
          return {
            ...clinic,
            transactions: count || 0
          };
        })
      );
      
      setClinics(clinicsWithTransactions);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      toast.error('Failed to load clinics');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClinics = clinics.filter(clinic => 
    (clinic.clinic_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (clinic.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Connected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Suspended</Badge>;
      case 'not_connected':
      default:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Not Connected</Badge>;
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
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
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
                              {clinic.logo_url ? (
                                <AvatarImage src={clinic.logo_url} alt={clinic.clinic_name || 'Clinic'} />
                              ) : (
                                <AvatarFallback className="bg-gradient-primary text-white">
                                  {(clinic.clinic_name || 'C').charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{clinic.clinic_name || 'Unnamed Clinic'}</p>
                              <p className="text-sm text-gray-500">{clinic.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          {getStatusBadge(clinic.stripe_status)}
                        </td>
                        <td className="py-4 text-gray-500">
                          {clinic.created_at ? new Date(clinic.created_at).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="py-4 text-gray-500">
                          {clinic.transactions}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ClinicsPage;
