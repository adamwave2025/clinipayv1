import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, Search, Filter, MoreHorizontal, Calendar, ChevronDown, List, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';

// Extended mock data for payment plans (will be replaced with real data)
const mockPaymentPlans = [
  {
    id: 'plan-1',
    patientName: 'John Smith',
    planName: 'Dental Treatment',
    amount: 750,
    progress: 66, // percentage
    status: 'active',
    nextDueDate: '2025-05-12',
    totalInstallments: 3,
    paidInstallments: 2,
  },
  {
    id: 'plan-2',
    patientName: 'Sarah Johnson',
    planName: 'Orthodontic Treatment',
    amount: 1200,
    progress: 33, 
    status: 'active',
    nextDueDate: '2025-05-05',
    totalInstallments: 3,
    paidInstallments: 1,
  },
  {
    id: 'plan-3',
    patientName: 'Michael Brown',
    planName: 'Wisdom Teeth Removal',
    amount: 550,
    progress: 100,
    status: 'completed',
    nextDueDate: null,
    totalInstallments: 2,
    paidInstallments: 2,
  },
  {
    id: 'plan-4',
    patientName: 'Emma Wilson',
    planName: 'Root Canal Treatment',
    amount: 800,
    progress: 0,
    status: 'pending',
    nextDueDate: '2025-05-10',
    totalInstallments: 4,
    paidInstallments: 0,
  },
  {
    id: 'plan-5',
    patientName: 'Daniel Lee',
    planName: 'Dental Implant',
    amount: 1500,
    progress: 25,
    status: 'active',
    nextDueDate: '2025-05-18',
    totalInstallments: 4,
    paidInstallments: 1,
  }
];

// Mock data for plan installments (will be replaced with real data)
const mockInstallments = [
  { id: 1, dueDate: '2025-04-01', amount: 250, status: 'paid', paidDate: '2025-04-01' },
  { id: 2, dueDate: '2025-05-01', amount: 250, status: 'paid', paidDate: '2025-05-01' },
  { id: 3, dueDate: '2025-06-01', amount: 250, status: 'upcoming', paidDate: null },
];

const ManagePlansPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const { paymentLinks, fetchPaymentLinks, isLoading: isLoadingPaymentLinks } = usePaymentLinks();

  // Fetch payment plans on component mount
  useEffect(() => {
    fetchPaymentPlans();
  }, []);

  const fetchPaymentPlans = async () => {
    setIsLoading(true);
    try {
      await fetchPaymentLinks();
      // Filter payment links to only include payment plans
      const plans = paymentLinks.filter(link => link.paymentPlan === true);
      setPaymentPlans(plans);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast.error('Failed to load payment plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPlanDetails = (plan: any) => {
    setSelectedPlan(plan);
    setShowPlanDetails(true);
  };

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Payment Plans" 
        description="Create and manage payment plans for your patients"
        action={
          <div className="flex space-x-2">
            <Button 
              className="btn-gradient flex items-center"
              onClick={handleCreatePlanClick}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>
        }
      />
      
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search plans or patients..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
                
                <Button variant="outline" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Date Range
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Plans Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Payment Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-gray-500">
                Loading payment plans...
              </div>
            ) : paymentPlans.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No payment plans found. Create your first payment plan to get started.</p>
                <Button 
                  className="mt-4 btn-gradient" 
                  onClick={handleCreatePlanClick}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Payment Plan
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* For now, we'll use the mock data until we have real payment schedule data */}
                  {mockPaymentPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.patientName}</TableCell>
                      <TableCell>{plan.planName}</TableCell>
                      <TableCell>£{plan.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-primary rounded-full" 
                              style={{ width: `${plan.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {plan.paidInstallments}/{plan.totalInstallments}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`
                            ${plan.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                            ${plan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                            ${plan.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
                          `}
                        >
                          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plan.nextDueDate ? new Date(plan.nextDueDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewPlanDetails(plan)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">View plan details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Plan Details Dialog */}
      <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Plan Details</DialogTitle>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-6">
              {/* Plan Summary */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Patient</h4>
                    <p>{selectedPlan.patientName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Plan Name</h4>
                    <p>{selectedPlan.planName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
                    <p>£{selectedPlan.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <Badge 
                      className={`
                        ${selectedPlan.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                        ${selectedPlan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${selectedPlan.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
                      `}
                    >
                      {selectedPlan.status.charAt(0).toUpperCase() + selectedPlan.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Progress */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Payment Progress</h4>
                <div className="flex items-center gap-3">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full" 
                      style={{ width: `${selectedPlan.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {selectedPlan.progress}% Complete
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedPlan.paidInstallments} of {selectedPlan.totalInstallments} installments paid
                </p>
              </div>
              
              {/* Installments */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Payment Schedule</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockInstallments.map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>{new Date(installment.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>£{installment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge 
                            className={`
                              ${installment.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                              ${installment.status === 'upcoming' ? 'bg-yellow-100 text-yellow-700' : ''}
                              ${installment.status === 'overdue' ? 'bg-red-100 text-red-700' : ''}
                            `}
                          >
                            {installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {installment.status === 'upcoming' && (
                            <Button size="sm" variant="outline">
                              Send Reminder
                            </Button>
                          )}
                          {installment.status === 'paid' && (
                            <span className="text-sm text-gray-500">
                              Paid on {new Date(installment.paidDate!).toLocaleDateString()}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between items-center">
            <Button variant="outline">Edit Plan</Button>
            <Button className="btn-gradient">Send Statement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManagePlansPage;
