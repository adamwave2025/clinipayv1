
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ProfileSettings from '@/components/settings/ProfileSettings';
import { ClinicData } from '@/hooks/useClinicData';

interface ProfileTabProps {
  clinicData: ClinicData | null;
  uploadLogo: (file: File) => Promise<any>; // Changed return type from Promise<void> to Promise<any>
  deleteLogo: () => Promise<any>; // Changed return type from Promise<void> to Promise<any>
  updateClinicData: (data: Partial<ClinicData>) => Promise<{ success: boolean }>;
  isUploading: boolean;
}

const ProfileTab = ({ 
  clinicData, 
  uploadLogo, 
  deleteLogo, 
  updateClinicData,
  isUploading 
}: ProfileTabProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<Partial<ClinicData>>({
    clinic_name: '',
    email: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    logo_url: '',
  });

  useEffect(() => {
    if (clinicData) {
      setProfileData({
        clinic_name: clinicData.clinic_name || '',
        email: clinicData.email || '',
        phone: clinicData.phone || '',
        address_line_1: clinicData.address_line_1 || '',
        address_line_2: clinicData.address_line_2 || '',
        city: clinicData.city || '',
        postcode: clinicData.postcode || '',
        logo_url: clinicData.logo_url || '',
      });
    }
  }, [clinicData]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await updateClinicData({
        clinic_name: profileData.clinic_name || null,
        email: profileData.email || null,
        phone: profileData.phone || null,
        address_line_1: profileData.address_line_1 || null,
        address_line_2: profileData.address_line_2 || null,
        city: profileData.city || null,
        postcode: profileData.postcode || null,
      });
      
      if (result.success) {
        toast.success('Profile settings saved successfully');
      } else {
        toast.error('Failed to save profile settings');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An error occurred while saving profile settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    await uploadLogo(file);
  };

  return (
    <ProfileSettings 
      profileData={profileData}
      handleProfileChange={handleProfileChange}
      handleSaveProfile={handleSaveProfile}
      isSubmitting={isSubmitting}
      handleFileUpload={handleFileUpload}
      handleDeleteLogo={deleteLogo}
      isUploading={isUploading}
    />
  );
};

export default ProfileTab;
