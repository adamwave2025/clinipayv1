
import React, { useEffect } from 'react';
import SettingsContainer from '@/containers/settings/SettingsContainer';

const SettingsPage = () => {
  useEffect(() => {
    console.log('📄 SettingsPage mounted');
    return () => {
      console.log('📄 SettingsPage unmounted');
    };
  }, []);

  return <SettingsContainer />;
};

export default SettingsPage;
