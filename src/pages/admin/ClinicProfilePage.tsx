
import React from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { MapPin, Mail, Phone, Calendar, Link, CreditCard, RefreshCcw, DollarSign, BarChart2 } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';

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

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  secondaryText?: string;
}

const ClinicProfilePage = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const clinic = getMockClinicData(clinicId || '');

  const StatCard = ({ title, value, icon, secondaryText }: StatCardProps) => (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {secondaryText && (
              <p className="text-sm text-gray-500 mt-1">{secondaryText}</p>
            )}
          </div>
          <div className="bg-gradient-primary p-2 rounded-full h-10 w-10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getStripeStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'disabled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Disabled</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title={clinic.name} 
        description="Clinic profile and details"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Clinic Info Card */}
        <Card className="card-shadow lg:col-span-1">
          <CardHeader>
            <CardTitle>Clinic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-6">
              <Avatar className="h-16 w-16 mr-4">
                <AvatarFallback className="bg-gradient-primary text-white text-xl">
                  {clinic.logo}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{clinic.name}</h3>
                <p className="text-gray-500">{clinic.contactName}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{clinic.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p>{clinic.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p>{clinic.address}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Stripe Connect</p>
                  <div className="mt-1">{getStripeStatusBadge(clinic.stripeStatus)}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date Joined</p>
                  <p>{new Date(clinic.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            title="CliniPay Fees Collected"
            value={`£${clinic.stats.feesCollected.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5 text-white" />}
          />
          
          <StatCard
            title="Average Payment"
            value={`£${clinic.stats.averagePayment.toFixed(2)}`}
            icon={<BarChart2 className="h-5 w-5 text-white" />}
          />
        </div>
      </div>
      
      {/* Activity Section */}
      <div className="space-y-6">
        {/* Recent Payments */}
        <Card className="card-shadow">
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
      </div>
    </DashboardLayout>
  );
};

export default ClinicProfilePage;
