
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Users, CreditCard, AlertCircle } from 'lucide-react';

// Mock data for the admin dashboard
const paymentData = [
  { month: 'Jan', value: 2400 },
  { month: 'Feb', value: 1398 },
  { month: 'Mar', value: 9800 },
  { month: 'Apr', value: 3908 },
  { month: 'May', value: 4800 },
  { month: 'Jun', value: 3800 },
  { month: 'Jul', value: 4300 },
];

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

const AdminDashboardPage = () => {
  const StatCard = ({ title, value, change, trend, icon }: StatCardProps) => (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              <span className={`text-xs font-medium ${
                trend === 'up' ? 'text-green-500' : 
                trend === 'down' ? 'text-red-500' : 
                'text-gray-500'
              }`}>
                {change}
              </span>
            </div>
          </div>
          <div className="bg-gradient-primary p-2 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title="Admin Dashboard" 
        description="Platform overview and statistics"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Clinics" 
          value="24" 
          change="+3 this month"
          trend="up"
          icon={<Users className="h-5 w-5 text-white" />}
        />
        <StatCard 
          title="Total Transactions" 
          value="£18,465" 
          change="+12.5% from last month"
          trend="up"
          icon={<CreditCard className="h-5 w-5 text-white" />}
        />
        <StatCard 
          title="Support Tickets" 
          value="3" 
          change="2 pending response"
          trend="neutral"
          icon={<AlertCircle className="h-5 w-5 text-white" />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle>Payment Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`£${value}`, 'Revenue']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#ab53de" 
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Recent Clinics</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {['Greenfield Medical', 'City Dental', 'Metro Physio', 'Wellness Hub'].map((clinic, i) => (
                <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{clinic}</p>
                    <p className="text-sm text-gray-500">Joined 2 days ago</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full mt-4">
              View All Clinics
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
