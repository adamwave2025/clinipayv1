
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import CreateLinkForm, { LinkFormData } from '@/components/dashboard/links/CreateLinkForm';
import LinkGeneratedDialog from '@/components/dashboard/links/LinkGeneratedDialog';

const CreateLinkPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<LinkFormData | null>(null);

  const handleLinkGenerated = (link: string, data: LinkFormData) => {
    setGeneratedLink(link);
    setFormData(data);
    setIsLoading(false);
    setShowConfirmation(true);
  };

  const resetForm = () => {
    setGeneratedLink(null);
    setFormData(null);
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Create Payment Link" 
        description="Generate a secure payment link to send to your patients"
      />
      
      <CreateLinkForm 
        onLinkGenerated={handleLinkGenerated}
        isLoading={isLoading}
      />

      <LinkGeneratedDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        generatedLink={generatedLink}
        formData={formData}
        onReset={resetForm}
      />
    </DashboardLayout>
  );
};

export default CreateLinkPage;
