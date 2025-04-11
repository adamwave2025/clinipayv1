
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Clinic = {
  id: string;
  clinic_name: string | null;
  created_at: string | null;
  stripe_status: string | null;
  payment_count?: number;
};

export const RecentClinicsTable = () => {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentClinics();
  }, []);

  const fetchRecentClinics = async () => {
    try {
      // Fetch the most recent clinics
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('id, clinic_name, created_at, stripe_status')
        .order('created_at', { ascending: false })
        .limit(4);

      if (clinicsError) throw clinicsError;

      // For each clinic, fetch their payment count
      const clinicsWithPaymentCounts = await Promise.all(
        (clinicsData || []).map(async (clinic) => {
          const { count, error: countError } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinic.id)
            .in('status', ['paid', 'partially_refunded']);

          if (countError) {
            console.error('Error fetching payment count:', countError);
            return { ...clinic, payment_count: 0 };
          }

          return { ...clinic, payment_count: count || 0 };
        })
      );

      setClinics(clinicsWithPaymentCounts);
    } catch (error) {
      console.error('Error fetching recent clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStripeStatusBadge = (status: string | null) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Connected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'not_connected':
      default:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Not Connected</Badge>;
    }
  };

  const handleClinicClick = (clinicId: string) => {
    navigate(`/admin/clinics/${clinicId}`);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Clinic</TableHead>
          <TableHead>Date Joined</TableHead>
          <TableHead>Stripe Status</TableHead>
          <TableHead>Payments Processed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clinics.map((clinic) => (
          <TableRow
            key={clinic.id}
            className="hover:bg-gray-50 cursor-pointer"
            onClick={() => handleClinicClick(clinic.id)}
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {clinic.clinic_name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{clinic.clinic_name || 'Unnamed Clinic'}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-gray-500">
              {clinic.created_at 
                ? new Date(clinic.created_at).toLocaleDateString() 
                : 'Unknown'}
            </TableCell>
            <TableCell>
              {getStripeStatusBadge(clinic.stripe_status)}
            </TableCell>
            <TableCell className="text-gray-500">
              {clinic.payment_count}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
