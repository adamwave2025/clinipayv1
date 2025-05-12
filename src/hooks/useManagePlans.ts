
  // Fix just the refreshData call in useManagePlans.ts
  const refreshData = async (userId?: string) => {
    try {
      console.log('Refreshing payment plans data with userId:', userId || user?.id);
      const fetchedPlans = await fetchPaymentPlans(userId || (user?.id || ''));

      return fetchedPlans;
    } catch (error) {
      console.error('Error refreshing payment plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh payment plans',
        variant: 'destructive',
      });
      return [];
    }
  };
