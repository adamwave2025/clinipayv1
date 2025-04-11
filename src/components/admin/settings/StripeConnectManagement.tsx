import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CreditCard, AlertTriangle, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import StatusBadge from '@/components/common/StatusBadge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type Clinic = {
  id: string;
  clinic_name: string | null;
  email: string | null;
  stripe_account_id: string | null;
  stripe_status: string | null;
};

interface StripeConnectManagementProps {
  clinics: Clinic[];
  isLoading: boolean;
  onUpdateClinics: (updatedClinics: Clinic[]) => void;
  refetchClinics: () => Promise<void>;
}

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
      
      // The key change: set stripe_status to "not_connected" string instead of null
      const { error, data } = await supabase
        .from('clinics')
        .update({
          stripe_account_id: null,
          stripe_status: 'not_connected'  // Use string value instead of null
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
      // Keep dialog open to show the error
    } finally {
      setIsDisconnecting(false);
    }
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
                        <StatusBadge status={clinic.stripe_status as any || 'not_connected'} />
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
          
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setError(null);
                setIsConfirmDialogOpen(false);
              }}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect Stripe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StripeConnectManagement;
