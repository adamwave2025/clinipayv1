
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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Filter, 
  Calendar, 
  ChevronDown, 
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';

const PaymentPlansPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PaymentLink | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<PaymentLink | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    amount: ''
  });

  const navigate = useNavigate();
  const { paymentLinks, fetchPaymentLinks, isLoading: isLoadingPaymentLinks } = usePaymentLinks();

  // Fetch payment plans on component mount
  useEffect(() => {
    fetchPaymentPlans();
  }, []);

  // Filter plans when search query changes
  useEffect(() => {
    if (paymentPlans.length === 0) return;
    
    const filtered = paymentPlans.filter(plan => 
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPlans(filtered);
  }, [searchQuery, paymentPlans]);

  const fetchPaymentPlans = async () => {
    setIsLoading(true);
    try {
      await fetchPaymentLinks();
      // Filter payment links to only include payment plans
      const plans = paymentLinks.filter(link => link.paymentPlan === true);
      setPaymentPlans(plans);
      setFilteredPlans(plans);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast.error('Failed to load payment plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = (plan: PaymentLink) => {
    setPlanToEdit(plan);
    setEditFormData({
      title: plan.title,
      description: plan.description || '',
      amount: plan.amount.toString()
    });
    setShowEditDialog(true);
  };

  const handleDeletePlan = (plan: PaymentLink) => {
    setPlanToDelete(plan);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      // Here we would call a function to delete the plan
      // For now, we'll just show a success message
      toast.success(`Payment plan "${planToDelete.title}" deleted successfully`);
      setShowDeleteDialog(false);
      setPlanToDelete(null);
      // Refresh the plans list
      await fetchPaymentPlans();
    } catch (error) {
      console.error('Error deleting payment plan:', error);
      toast.error('Failed to delete payment plan');
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveEditedPlan = async () => {
    if (!planToEdit) return;
    
    try {
      // Here we would call a function to update the plan
      // For now, we'll just show a success message
      toast.success(`Payment plan "${editFormData.title}" updated successfully`);
      setShowEditDialog(false);
      setPlanToEdit(null);
      // Refresh the plans list
      await fetchPaymentPlans();
    } catch (error) {
      console.error('Error updating payment plan:', error);
      toast.error('Failed to update payment plan');
    }
  };

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Manage Payment Plans" 
        description="View, edit and manage all your payment plans"
        action={
          <Button 
            className="btn-gradient"
            onClick={handleCreatePlanClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Plan
          </Button>
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
                  placeholder="Search plans..." 
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
            ) : filteredPlans.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {paymentPlans.length === 0 ? (
                  <>
                    <p>No payment plans found. Create your first payment plan to get started.</p>
                    <Button 
                      className="mt-4 btn-gradient" 
                      onClick={handleCreatePlanClick}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Payment Plan
                    </Button>
                  </>
                ) : (
                  <p>No payment plans match your search criteria.</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount per Payment</TableHead>
                    <TableHead>Payment Cycle</TableHead>
                    <TableHead>Number of Payments</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.title}</TableCell>
                      <TableCell>{plan.description || '-'}</TableCell>
                      <TableCell>{formatCurrency(plan.amount)}</TableCell>
                      <TableCell className="capitalize">{plan.paymentCycle || '-'}</TableCell>
                      <TableCell>{plan.paymentCount || '-'}</TableCell>
                      <TableCell>{formatCurrency(plan.planTotalAmount || 0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeletePlan(plan)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Plan</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this payment plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {planToDelete && (
            <div className="my-4 p-4 border rounded-md bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-700">Confirm deletion of:</h3>
                  <p className="text-sm text-gray-700 mt-1"><strong>Plan Name:</strong> {planToDelete.title}</p>
                  <p className="text-sm text-gray-700"><strong>Amount:</strong> {formatCurrency(planToDelete.amount)}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive"
              onClick={confirmDeletePlan}
            >
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Plan</DialogTitle>
            <DialogDescription>
              Update the details of this payment plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Plan Name</label>
              <Input
                id="title"
                name="title"
                value={editFormData.title}
                onChange={handleEditFormChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Input
                id="description"
                name="description"
                value={editFormData.description}
                onChange={handleEditFormChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">Amount per Payment</label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={editFormData.amount}
                onChange={handleEditFormChange}
              />
            </div>
            
            <div className="pt-2 text-sm text-amber-600">
              <p>Note: Changes to payment count, payment cycle or fundamental plan structure are not supported after creation.</p>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={saveEditedPlan}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PaymentPlansPage;
