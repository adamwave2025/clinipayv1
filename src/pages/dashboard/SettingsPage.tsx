
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SettingsContainer from '@/containers/settings/SettingsContainer';

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Only redirect if there's no tab parameter at all
  useEffect(() => {
    if (!searchParams.has('tab')) {
      console.log('No tab parameter found, defaulting to profile');
      setSearchParams({ tab: 'profile' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  return <SettingsContainer />;
};

export default SettingsPage;
