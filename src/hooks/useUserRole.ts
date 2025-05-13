
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

/**
 * Legacy hook to get user role - now uses the unified auth context
 * Kept for compatibility with existing code
 */
export function useUserRole() {
  const { role, isLoading, isFullyLoaded } = useUnifiedAuth();
  
  return { 
    role, 
    loading: isLoading || !isFullyLoaded 
  };
}
