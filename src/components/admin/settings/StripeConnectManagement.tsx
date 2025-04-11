import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StripeConnectManagementProps, Clinic } from '@/types/admin';
import StripeClinicRow from './StripeClinicRow';
import DisconnectDialog from './DisconnectDialog';

const StripeConnectManagement = ({ 
  clinics, 
  isLoading, 
  onUpdateClinics, 
  refetchClinics 
}: StripeConnectManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDisconnectStripe = (clinicId: string) => {
    setSelectedClinic(clinicId);
    setError(null);
    setIsConfirmDialogOpen(true);
  };

  const confirmDisconnect = async () => {
    if (!selectedClinic) return;
    
    setIsDisconnecting(true);
    setError(null);
    
    try {
      console.log(`Disconnecting Stripe for clinic ${selectedClinic}`);
      
      const { error, data } = await supabase
        .from('clinics')
        .update({
          stripe_account_id: null,
          stripe_status: 'not_connected'
        })
        .eq('id', selectedClinic)
        .select();
      
      if (error) {
        console.error('Database error when disconnecting Stripe:', error);
        setError(`Failed to disconnect: ${error.message}`);
        throw error;
      }
      
      console.log(`Successfully updated database for clinic ${selectedClinic}`, data);
      
      // Update local state
      const updatedClinics = clinics.map(clinic => 
        clinic.id === selectedClinic 
          ? { ...clinic, stripe_account_id: null, stripe_status: 'not_connected' } 
          : clinic
      );
      
      onUpdateClinics(updatedClinics);
      
      // Refresh data from the database to ensure consistency
      await refetchClinics();
      
      toast.success(`Stripe disconnected for clinic ${selectedClinic}`);
      setIsConfirmDialogOpen(false);
    } catch (error: any) {
      console.error('Error disconnecting Stripe:', error);
      setError(`Failed to disconnect Stripe: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCloseDialog = () => {
    setError(null);
    setIsConfirmDialogOpen(false);
  };

  const filteredClinics = clinics.filter(clinic => 
    clinic.clinic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
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
                    <StripeClinicRow 
                      key={clinic.id}
                      clinic={clinic} 
                      onDisconnect={handleDisconnectStripe} 
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DisconnectDialog
        isOpen={isConfirmDialogOpen}
        onClose={handleCloseDialog}
        onConfirm={confirmDisconnect}
        isDisconnecting={isDisconnecting}
        error={error}
      />
    </>
  );
};

export default StripeConnectManagement;
