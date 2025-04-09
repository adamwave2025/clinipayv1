
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

// Mock data for the clinic profile
const getMockClinicData = (id: string) => ({
  id,
  name: 'Greenfield Medical Clinic',
  contactName: 'Dr. Sarah Johnson',
  email: 'contact@greenfieldclinic.com',
  phone: '+44 20 1234 5678',
  address: '123 Health Avenue, London, UK',
  stripeStatus: 'active',
  joinDate: '2025-03-15',
  logo: 'G',
  stats: {
    totalPayments: 28,
    totalAmount: 4350.75,
    totalRefunds: 2,
    refundAmount: 320.50,
    feesCollected: 148.62,
    averagePayment: 155.38
  },
  recentPayments: [
    { id: 'p1', patientName: 'John Smith', amount: 125.00, date: '2025-04-01', status: 'paid' },
    { id: 'p2', patientName: 'Emma Wilson', amount: 210.50, date: '2025-03-28', status: 'paid' },
    { id: 'p3', patientName: 'Michael Brown', amount: 75.25, date: '2025-03-24', status: 'refunded' },
    { id: 'p4', patientName: 'Sophia Davis', amount: 180.00, date: '2025-03-20', status: 'paid' },
    { id: 'p5', patientName: 'James Taylor', amount: 95.00, date: '2025-03-15', status: 'pending' }
  ],
  links: [
    { id: 'l1', name: 'Consultation Payment', created: '2025-03-10', usageCount: 12 },
    { id: 'l2', name: 'Follow-up Session', created: '2025-03-15', usageCount: 8 },
    { id: 'l3', name: 'Special Treatment', created: '2025-03-20', usageCount: 5 }
  ]
});

const ClinicProfilePage = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const clinic = getMockClinicData(clinicId || '');

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title={clinic.name} 
        description="Clinic profile and details"
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Payments"
          value={`${clinic.stats.totalPayments}`}
          secondaryText={`£${clinic.stats.totalAmount.toFixed(2)}`}
          icon={<CreditCard className="h-5 w-5 text-white" />}
        />
        
        <StatCard
          title="Total Refunds"
          value={`${clinic.stats.totalRefunds}`}
          secondaryText={`£${clinic.stats.refundAmount.toFixed(2)}`}
          icon={<RefreshCcw className="h-5 w-5 text-white" />}
        />
        
        <StatCard
          title="CliniPay Fees"
          value={`£${clinic.stats.feesCollected.toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5 text-white" />}
        />
        
        <StatCard
          title="Average Payment"
          value={`£${clinic.stats.averagePayment.toFixed(2)}`}
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
              name={clinic.name}
              contactName={clinic.contactName}
              email={clinic.email}
              phone={clinic.phone}
              address={clinic.address}
              stripeStatus={clinic.stripeStatus}
              joinDate={clinic.joinDate}
              logo={clinic.logo}
            />
          </CardContent>
        </Card>
        
        {/* Recent Payments */}
        <Card className="card-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
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
                {clinic.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.patientName}</TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status as any} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Payment Links */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Payment Links</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinic.links.map((link) => (
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
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ClinicProfilePage;
