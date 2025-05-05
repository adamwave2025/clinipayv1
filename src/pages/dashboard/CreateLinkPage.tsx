
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const CreateLinkPage = () => {
  const navigate = useNavigate();
  
  // Redirect to Reusable Links page
  useEffect(() => {
    navigate('/dashboard/reusable-links');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" />
      <span className="ml-2">Redirecting...</span>
    </div>
  );
};

export default CreateLinkPage;
