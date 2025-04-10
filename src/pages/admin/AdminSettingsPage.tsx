import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Percent, CreditCard, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const AdminSettingsPage = () => {
  const [platformFee, setPlatformFee] = useState('3.0');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);

  const clinics = [
    {
      id: '1',
      name: 'Greenfield Medical Clinic',
      email: 'contact@greenfieldclinic.com',
      stripeStatus: 'active',
    },
    {
      id: '2',
      name: 'City Dental Practice',
      email: 'info@citydental.com',
      stripeStatus: 'active',
    },
    {
      id: '3',
      name: 'Metro Physiotherapy',
      email: 'admin@metrophysio.com',
      stripeStatus: 'pending',
    },
    {
      id: '4',
      name: 'Wellness Hub',
      email: 'info@wellnesshub.com',
      stripeStatus: 'active',
    },
    {
      id: '5',
      name: 'Riverdale Hospital',
      email: 'contact@riverdalehospital.com',
      stripeStatus: 'not_connected',
    },
  ];

  const filteredClinics = clinics.filter(clinic => 
    clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveFee = () => {
    toast.success(`Platform fee updated to ${platformFee}%`);
  };

  const handleDisconnectStripe = (clinicId: string) => {
    setSelectedClinic(clinicId);
    setIsConfirmDialogOpen(true);
  };

  const confirmDisconnect = () => {
    toast.success(`Stripe disconnected for clinic ${selectedClinic}`);
    setIsConfirmDialogOpen(false);
  };

  const getStripeStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Connected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'not_connected':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Not Connected</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title="Admin Settings" 
        description="Configure global platform settings"
      />
      
      <div className="space-y-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Platform Fee</CardTitle>
            <CardDescription>
              Set the global percentage fee charged on all payments processed through CliniPay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 max-w-md">
              <div className="flex-1">
                <Label htmlFor="platform-fee">Fee Percentage</Label>
                <div className="relative mt-1">
                  <Input
                    id="platform-fee"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="pr-10"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button onClick={handleSaveFee}>Save</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Stripe Connect Management</CardTitle>
            <CardDescription>
              Manage clinics' Stripe Connect integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Stripe Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClinics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-gray-500">
                        No clinics found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClinics.map((clinic) => (
                      <TableRow key={clinic.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-primary text-white text-xs">
                                {clinic.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{clinic.name}</p>
                              <p className="text-xs text-gray-500">{clinic.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStripeStatusBadge(clinic.stripeStatus)}
                        </TableCell>
                        <TableCell className="text-right">
                          {clinic.stripeStatus === 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
                              onClick={() => handleDisconnectStripe(clinic.id)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Disconnect
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Stripe Disconnection
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to force disconnect Stripe for this clinic? This will immediately stop payment processing for them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDisconnect}
            >
              Disconnect Stripe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSettingsPage;
