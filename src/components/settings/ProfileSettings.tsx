
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FileUpload from '@/components/common/FileUpload';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ClinicData } from '@/hooks/useClinicData';

interface ProfileSettingsProps {
  profileData: Partial<ClinicData>;
  handleProfileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: () => Promise<void>;
  isSubmitting: boolean;
  handleFileUpload: (file: File) => Promise<void>;
  handleDeleteLogo: () => Promise<void>;
  isUploading: boolean;
}

const ProfileSettings = ({
  profileData,
  handleProfileChange,
  handleSaveProfile,
  isSubmitting,
  handleFileUpload,
  handleDeleteLogo,
  isUploading
}: ProfileSettingsProps) => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profileData.logo_url || ''} alt="Clinic Logo" />
              <AvatarFallback className="bg-gradient-primary text-white text-4xl">
                {profileData.clinic_name ? profileData.clinic_name.charAt(0) : '?'}
              </AvatarFallback>
            </Avatar>
            
            <FileUpload
              onFileSelected={handleFileUpload}
              buttonText="Upload Logo"
              accept="image/*"
              maxSizeMB={2}
              isLoading={isUploading}
              currentImageUrl={profileData.logo_url || null}
              onDelete={handleDeleteLogo}
              className="w-full"
              showPreview={false}
            />
          </div>
          
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clinic_name">Clinic Name</Label>
              <Input
                id="clinic_name"
                name="clinic_name"
                value={profileData.clinic_name || ''}
                onChange={handleProfileChange}
                className="w-full input-focus"
                placeholder="Enter clinic name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileData.email || ''}
                onChange={handleProfileChange}
                className="w-full input-focus"
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={profileData.phone || ''}
                onChange={handleProfileChange}
                className="w-full input-focus"
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address_line_1">Address Line 1</Label>
              <Input
                id="address_line_1"
                name="address_line_1"
                value={profileData.address_line_1 || ''}
                onChange={handleProfileChange}
                className="w-full input-focus"
                placeholder="Enter address line 1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input
                id="address_line_2"
                name="address_line_2"
                value={profileData.address_line_2 || ''}
                onChange={handleProfileChange}
                className="w-full input-focus"
                placeholder="Enter address line 2 (optional)"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={profileData.city || ''}
                  onChange={handleProfileChange}
                  className="w-full input-focus"
                  placeholder="Enter city"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  name="postcode"
                  value={profileData.postcode || ''}
                  onChange={handleProfileChange}
                  className="w-full input-focus"
                  placeholder="Enter postcode"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSaveProfile} 
              className="btn-gradient"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
