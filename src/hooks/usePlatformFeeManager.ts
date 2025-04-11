
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePlatformFeeManager = () => {
  const [platformFee, setPlatformFee] = useState('3.0');

  useEffect(() => {
    fetchPlatformFee();
  }, []);

  const fetchPlatformFee = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'platform_fee_percent')
        .single();
      
      if (error) {
        console.error('Error fetching platform fee:', error);
        // If no record exists, we'll create it with a default value
        if (error.code === 'PGRST116') {
          console.log('Platform fee setting not found, using default value');
          return; // Keep using the default value set in state
        }
        throw error;
      }
      
      if (data) {
        setPlatformFee(data.value);
      }
    } catch (error) {
      console.error('Error fetching platform fee:', error);
      toast.error('Failed to load platform fee setting');
    }
  };

  return {
    platformFee,
    setPlatformFee,
    fetchPlatformFee
  };
};
