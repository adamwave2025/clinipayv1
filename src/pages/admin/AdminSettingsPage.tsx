
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

const AdminSettingsPage = () => {
  const [platformFee, setPlatformFee] = useState('3.0');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [clinics, setClinics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch platform fee and clinics on component mount
  useEffect(() => {
    fetchPlatformFee();
    fetchClinics();
  }, []);

  const fetchPlatformFee = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'platform_fee_percent')
        .single();
      
      if (error) throw error;
      if (data) {
        setPlatformFee(data.value);
      }
    } catch (error) {
      console.error('Error fetching platform fee:', error);
      toast.error('Failed to load platform fee setting');
    }
  };

  const fetchClinics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, clinic_name, email, stripe_account_id, stripe_status');
      
      if (error) throw error;
      if (data) {
        setClinics(data);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      toast.error('Failed to load clinics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFee = async () => {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: platformFee })
        .eq('key', 'platform_fee_percent');
      
      if (error) throw error;
      
      toast.success(`Platform fee updated to ${platformFee}%`);
    } catch (error) {
      console.error('Error updating platform fee:', error);
      toast.error('Failed to update platform fee');
    }
  };

  const handleDisconnectStripe = (clinicId: string) => {
    setSelectedClinic(clinicId);
    setIsConfirmDialogOpen(true);
  };

  const confirmDisconnect = async () => {
    if (!selectedClinic) return;
    
    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          stripe_account_id: null,
          stripe_status: null
        })
        .eq('id', selectedClinic);
      
      if (error) throw error;
      
      // Update local state
      setClinics(clinics.map(clinic => 
        clinic.id === selectedClinic 
          ? { ...clinic, stripe_account_id: null, stripe_status: null } 
          : clinic
      ));
      
      toast.success(`Stripe disconnected for clinic ${selectedClinic}`);
    } catch (error) {
      console.error('Error disconnecting Stripe:', error);
      toast.error('Failed to disconnect Stripe');
    } finally {
      setIsConfirmDialogOpen(false);
    }
  };

  const filteredClinics = clinics.filter(clinic => 
    clinic.clinic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStripeStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Connected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'not_connected':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Not Connected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Not Connected</Badge>;
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-gray-500">
                        Loading clinics...
                      </TableCell>
                    </TableRow>
                  ) : filteredClinics.length === 0 ? (
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
                                {clinic.clinic_name?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{clinic.clinic_name || 'Unnamed Clinic'}</p>
                              <p className="text-xs text-gray-500">{clinic.email || 'No email'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStripeStatusBadge(clinic.stripe_status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {clinic.stripe_status === 'connected' && (
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
