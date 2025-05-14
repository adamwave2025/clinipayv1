
import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import SettingsContainer from '@/containers/settings/SettingsContainer';

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // If we're on the settings page without a tab parameter, default to profile
  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (location.pathname === '/dashboard/settings' && !tab) {
      // Use replace to avoid adding to history stack
      navigate('/dashboard/settings?tab=profile', { replace: true });
    }
  }, [location.pathname, searchParams, navigate]);
  
  return <SettingsContainer />;
};

export default SettingsPage;
