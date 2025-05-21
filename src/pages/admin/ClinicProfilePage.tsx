
import React from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Link, CreditCard, RefreshCcw, DollarSign, BarChart2 } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import StatCard from '@/components/common/StatCard';
import ClinicInfo from '@/components/clinic/ClinicInfo';
import { useClinicProfile } from '@/hooks/useClinicProfile';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatters';

const ClinicProfilePage = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const { 
    clinic, 
    stats, 
    recentPayments, 
    links, 
    isLoading, 
    error 
  } = useClinicProfile(clinicId || '');
  
  // Format address for display
  const formatAddress = () => {
    if (!clinic) return '';
    
    const parts = [
      clinic.address_line_1,
      clinic.address_line_2,
      clinic.city,
      clinic.postcode
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="admin">
        <PageHeader 
          title="Clinic Profile" 
          description="Loading clinic details..."
        />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="card-shadow">
                <CardContent className="p-6 h-[104px] flex items-center justify-center">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="card-shadow lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle>Clinic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="card-shadow lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <LoadingSpinner size="md" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !clinic) {
    return (
      <DashboardLayout userType="admin">
        <PageHeader 
          title="Error" 
          description="Could not load clinic profile"
        />
        <Card className="card-shadow">
          <CardContent className="p-6">
            <p className="text-red-500">
              {error || 'Clinic data not found. Please try again later.'}
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title={clinic.clinic_name || 'Unnamed Clinic'} 
        description="Clinic profile and details"
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Payments"
          value={`${stats.totalPayments}`}
          secondaryText={formatCurrency(stats.totalAmount)}
          icon={<CreditCard className="h-5 w-5 text-white" />}
        />
        
        <StatCard
          title="Total Refunds"
          value={`${stats.totalRefunds}`}
          secondaryText={formatCurrency(stats.refundAmount)}
          icon={<RefreshCcw className="h-5 w-5 text-white" />}
        />
        
        <StatCard
          title="CliniPay Revenue"
          value={formatCurrency(stats.feesCollected)}
          icon={<DollarSign className="h-5 w-5 text-white" />}
        />
        
        <StatCard
          title="Average Payment"
          value={formatCurrency(stats.averagePayment)}
          icon={<BarChart2 className="h-5 w-5 text-white" />}
        />
      </div>
      
      {/* Clinic Info and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Clinic Info Card */}
        <Card className="card-shadow lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Clinic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ClinicInfo
              name={clinic.clinic_name || 'Unnamed Clinic'}
              contactName={clinic.clinic_name || 'No contact name'}
              email={clinic.email || 'No email provided'}
              phone={clinic.phone || 'No phone provided'}
              address={formatAddress()}
              stripeStatus={clinic.stripe_status || 'not_connected'}
              joinDate={clinic.created_at || new Date().toISOString()}
              logo={clinic.clinic_name?.charAt(0) || 'C'}
            />
          </CardContent>
        </Card>
        
        {/* Recent Payments */}
        <Card className="card-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patientName}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status as any} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-4">No payment records found for this clinic</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Payment Links */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Payment Links</CardTitle>
        </CardHeader>
        <CardContent>
          {links.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Link className="h-4 w-4 mr-2 text-gray-400" />
                        {link.name}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(link.created).toLocaleDateString()}</TableCell>
                    <TableCell>{link.usageCount} times</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-4">No payment links found for this clinic</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ClinicProfilePage;
