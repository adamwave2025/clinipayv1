
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';

export function usePaymentLinks() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [archivedLinks, setArchivedLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPaymentLinks = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the clinic_id for the current user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!userData.clinic_id) {
        throw new Error('No clinic associated with this user');
      }

      // Fetch active payment links for this clinic
      const { data: activeData, error: activeLinksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', userData.clinic_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (activeLinksError) {
        throw new Error(activeLinksError.message);
      }

      // Fetch archived payment links for this clinic
      const { data: archivedData, error: archivedLinksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('clinic_id', userData.clinic_id)
        .eq('is_active', false)
        .order('created_at', { ascending: false });

      if (archivedLinksError) {
        throw new Error(archivedLinksError.message);
      }

      // Transform data to match our PaymentLink type
      const formatLinks = (data: any[]): PaymentLink[] => data.map(link => ({
        id: link.id,
        title: link.title || '',
        amount: link.amount || 0,
        type: link.type || 'other',
        description: link.description || '',
        url: `${window.location.origin}/payment/${link.id}`,
        createdAt: new Date(link.created_at).toLocaleDateString(),
        isActive: link.is_active
      }));

      setPaymentLinks(formatLinks(activeData || []));
      setArchivedLinks(formatLinks(archivedData || []));
    } catch (error: any) {
      console.error('Error fetching payment links:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArchiveStatus = async (linkId: string, archive: boolean) => {
    if (!user) {
      toast.error('You must be logged in to manage payment links');
      return { success: false };
    }

    setIsArchiveLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('payment_links')
        .update({ is_active: !archive })
        .eq('id', linkId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Refresh the payment links list
      await fetchPaymentLinks();

      const action = archive ? 'archived' : 'unarchived';
      toast.success(`Payment link ${action} successfully`);

      return { success: true };
    } catch (error: any) {
      console.error(`Error ${archive ? 'archiving' : 'unarchiving'} payment link:`, error);
      toast.error(`Failed to ${archive ? 'archive' : 'unarchive'} payment link: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const archivePaymentLink = async (linkId: string) => {
    return toggleArchiveStatus(linkId, true);
  };

  const unarchivePaymentLink = async (linkId: string) => {
    return toggleArchiveStatus(linkId, false);
  };

  const createPaymentLink = async (linkData: Omit<PaymentLink, 'id' | 'url' | 'createdAt' | 'isActive'>) => {
    if (!user) {
      toast.error('You must be logged in to create payment links');
      return { success: false };
    }

    try {
      // Get the clinic_id for the current user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!userData.clinic_id) {
        throw new Error('No clinic associated with this user');
      }

      // Create the payment link in the database
      const { data, error: insertError } = await supabase
        .from('payment_links')
        .insert({
          clinic_id: userData.clinic_id,
          title: linkData.title,
          amount: linkData.amount,
          type: linkData.type,
          description: linkData.description,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Refresh the payment links list
      await fetchPaymentLinks();

      return { 
        success: true, 
        paymentLink: {
          id: data.id,
          title: data.title,
          amount: data.amount,
          type: data.type,
          description: data.description || '',
          url: `${window.location.origin}/payment/${data.id}`,
          createdAt: new Date(data.created_at).toLocaleDateString(),
          isActive: data.is_active
        } 
      };
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchPaymentLinks();
  }, [user]);

  return {
    paymentLinks,
    archivedLinks,
    isLoading,
    isArchiveLoading,
    error,
    fetchPaymentLinks,
    createPaymentLink,
    archivePaymentLink,
    unarchivePaymentLink
  };
}
