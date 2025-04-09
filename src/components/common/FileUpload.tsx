
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface FileUploadProps {
  onFileSelected: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMB?: number;
  buttonText?: string;
  className?: string;
  isLoading?: boolean;
  currentImageUrl?: string | null;
  onDelete?: () => Promise<void>;
  showPreview?: boolean;
}

const FileUpload = ({
  onFileSelected,
  accept = 'image/*',
  maxSizeMB = 5,
  buttonText = 'Upload File',
  className = '',
  isLoading = false,
  currentImageUrl = null,
  onDelete,
  showPreview = true
}: FileUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds the ${maxSizeMB}MB limit`);
      return;
    }

    try {
      setIsUploading(true);
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      
      // Call the provided onFileSelected callback
      await onFileSelected(file);
      
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      // Reset preview on error
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!onDelete) return;
    
    try {
      setIsUploading(true);
      await onDelete();
      setPreviewUrl(null);
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showPreview && previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover rounded-md max-h-32"
          />
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteImage}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              disabled={isUploading || isLoading}
            >
              <X size={16} className="text-gray-700" />
            </button>
          )}
        </div>
      ) : null}
      
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={isUploading || isLoading}
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          disabled={isUploading || isLoading}
          className="w-full"
        >
          {isUploading || isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {buttonText}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;
