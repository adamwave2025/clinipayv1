
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, CreditCard, RefreshCcw, DollarSign } from 'lucide-react';

// Mock data for the admin dashboard
const recentClinics = [
  { 
    id: '1',
    name: 'Greenfield Medical', 
    joinDate: '2025-03-15',
    stripeStatus: 'active',
    paymentsProcessed: 28,
  },
  { 
    id: '2',
    name: 'City Dental', 
    joinDate: '2025-02-22',
    stripeStatus: 'active',
    paymentsProcessed: 42,
  },
  { 
    id: '3',
    name: 'Metro Physio', 
    joinDate: '2025-04-05',
    stripeStatus: 'pending',
    paymentsProcessed: 0,
  },
  { 
    id: '4',
    name: 'Wellness Hub', 
    joinDate: '2025-01-10',
    stripeStatus: 'active',
    paymentsProcessed: 65,
  },
];

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const StatCard = ({ title, value, change, trend, icon }: StatCardProps) => (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            <span className={`text-xs font-medium ${
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {change}
            </span>
          </div>
          <div className="bg-gradient-primary p-2 rounded-full">
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

  const handleClinicClick = (clinicId: string) => {
    navigate(`/admin/clinics/${clinicId}`);
  };

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title="Admin Dashboard" 
        description="Platform overview and statistics"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Clinics" 
          value="24" 
          change="+3 this month"
          trend="up"
          icon={<Users className="h-5 w-5 text-white" />}
        />
        <StatCard 
          title="Total Payments" 
          value="£72,450" 
          change="+12.5% from last month"
          trend="up"
          icon={<CreditCard className="h-5 w-5 text-white" />}
        />
        <StatCard 
          title="Total Refunds" 
          value="£3,245" 
          change="-2.1% from last month"
          trend="down"
          icon={<RefreshCcw className="h-5 w-5 text-white" />}
        />
        <StatCard 
          title="CliniPay Revenue" 
          value="£6,820" 
          change="+8.3% from last month"
          trend="up"
          icon={<DollarSign className="h-5 w-5 text-white" />}
        />
      </div>
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Recent Clinics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-gray-500">Clinic</th>
                  <th className="pb-3 font-medium text-gray-500">Date Joined</th>
                  <th className="pb-3 font-medium text-gray-500">Stripe Status</th>
                  <th className="pb-3 font-medium text-gray-500">Payments Processed</th>
                </tr>
              </thead>
              <tbody>
                {recentClinics.map((clinic, index) => (
                  <tr 
                    key={index} 
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
                          <p className="font-medium">{clinic.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-500">
                      {new Date(clinic.joinDate).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      {getStripeStatusBadge(clinic.stripeStatus)}
                    </td>
                    <td className="py-4 text-gray-500">
                      {clinic.paymentsProcessed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
